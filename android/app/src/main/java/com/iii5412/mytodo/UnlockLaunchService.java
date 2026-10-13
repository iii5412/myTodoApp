package com.iii5412.mytodo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

/**
 * Watches for the phone being unlocked and brings the to-do list to the front.
 *
 * Android only lets a background app open its own screen when it holds "display over other
 * apps". With that permission the list opens straight away. No tap-to-open reminder is posted.
 *
 * ACTION_USER_PRESENT cannot be received by a manifest receiver, so this foreground service
 * registers one while it runs. The boot receiver restarts the service after a reboot.
 */
public class UnlockLaunchService extends Service {
    private static final String CHANNEL_SERVICE = "unlock_service";
    private static final int ID_SERVICE = 1001;
    private static final long DEBOUNCE_MS = 2000;

    private static final String TAG = "UnlockLaunch";
    static final String EXTRA_FROM_UNLOCK = "from_unlock";

    private BroadcastReceiver receiver;
    private View overlay;
    private long lastLaunchAt = -DEBOUNCE_MS;

    static void start(Context context) {
        ContextCompat.startForegroundService(context, new Intent(context, UnlockLaunchService.class));
    }

    static void stop(Context context) {
        context.stopService(new Intent(context, UnlockLaunchService.class));
        clearLegacyReminder(context);
    }

    /** Remove reminders left by the previous APK, including when the watcher is disabled. */
    static void clearLegacyReminder(Context context) {
        NotificationManagerCompat.from(context).cancel(1002);
        if (Build.VERSION.SDK_INT >= 26) {
            context.getSystemService(NotificationManager.class).deleteNotificationChannel("unlock_open");
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannels();
        Notification notification = buildServiceNotification();
        if (Build.VERSION.SDK_INT >= 34) {
            ServiceCompat.startForeground(this, ID_SERVICE, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(ID_SERVICE, notification);
        }

        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (Intent.ACTION_USER_PRESENT.equals(intent.getAction())) onUnlocked();
            }
        };
        // USER_PRESENT is sent by SystemUI, not by the system uid, so a not-exported receiver would never
        // get it. It is a protected broadcast: other apps cannot send it, so exporting is safe.
        ContextCompat.registerReceiver(this, receiver, new IntentFilter(Intent.ACTION_USER_PRESENT), ContextCompat.RECEIVER_EXPORTED);
        ensureOverlay();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!UnlockPrefs.isEnabled(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        ensureOverlay();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (receiver != null) {
            try {
                unregisterReceiver(receiver);
            } catch (IllegalArgumentException ignored) {
                // Already unregistered.
            }
            receiver = null;
        }
        removeOverlay();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void onUnlocked() {
        long now = SystemClock.elapsedRealtime();
        if (now - lastLaunchAt < DEBOUNCE_MS) return;
        lastLaunchAt = now;
        Log.i(TAG, "unlocked; overlayGranted=" + Settings.canDrawOverlays(this));

        if (Settings.canDrawOverlays(this)) {
            ensureOverlay();
            try {
                startActivity(buildOpenIntent());
                return;
            } catch (RuntimeException error) {
                Log.w(TAG, "startActivity failed", error);
            }
        }
    }

    private Intent buildOpenIntent() {
        return new Intent(this, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            .putExtra(EXTRA_FROM_UNLOCK, true);
    }

    private PendingIntent buildOpenPendingIntent() {
        return PendingIntent.getActivity(this, 0, buildOpenIntent(), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        clearLegacyReminder(this);
        NotificationChannel service = new NotificationChannel(CHANNEL_SERVICE, getString(R.string.channel_service), NotificationManager.IMPORTANCE_LOW);
        service.setShowBadge(false);
        manager.createNotificationChannel(service);
    }

    private Notification buildServiceNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_SERVICE)
            .setSmallIcon(R.drawable.ic_stat_todo)
            .setContentTitle(getString(R.string.service_notification_title))
            .setContentText(getString(R.string.service_notification_text))
            .setContentIntent(buildOpenPendingIntent())
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    /**
     * A 1px invisible overlay window. Android 15 only lets "display over other apps" start
     * activities from the background while the app also has a visible overlay window.
     */
    private void ensureOverlay() {
        if (overlay != null || !Settings.canDrawOverlays(this)) return;
        try {
            WindowManager windowManager = getSystemService(WindowManager.class);
            View view = new View(this);
            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                1, 1,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                    | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
            params.gravity = Gravity.TOP | Gravity.START;
            windowManager.addView(view, params);
            overlay = view;
        } catch (RuntimeException ignored) {
            overlay = null;
        }
    }

    private void removeOverlay() {
        if (overlay == null) return;
        try {
            getSystemService(WindowManager.class).removeView(overlay);
        } catch (RuntimeException ignored) {
            // The window is already gone.
        }
        overlay = null;
    }
}
