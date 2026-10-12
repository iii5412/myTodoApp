package com.iii5412.mytodo;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** Bridge for the settings screen: the unlock switch and the three phone permissions behind it. */
@CapacitorPlugin(
    name = "UnlockLaunch",
    permissions = {
        @Permission(strings = {Manifest.permission.POST_NOTIFICATIONS}, alias = "notifications")
    }
)
public class UnlockLaunchPlugin extends Plugin {

    private JSObject status() {
        Context context = getContext();
        PowerManager power = context.getSystemService(PowerManager.class);
        JSObject result = new JSObject();
        result.put("enabled", UnlockPrefs.isEnabled(context));
        result.put("overlayGranted", Settings.canDrawOverlays(context));
        result.put("notificationsGranted", NotificationManagerCompat.from(context).areNotificationsEnabled());
        result.put("batteryUnrestricted", power != null && power.isIgnoringBatteryOptimizations(context.getPackageName()));
        return result;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        Context context = getContext();
        UnlockPrefs.setEnabled(context, enabled);
        if (enabled) {
            UnlockLaunchService.start(context);
        } else {
            UnlockLaunchService.stop(context);
        }
        call.resolve(status());
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        openSettings(call, new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, packageUri()), null);
    }

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        openSettings(
            call,
            new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, packageUri()),
            new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        );
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationsResult");
        } else {
            call.resolve(status());
        }
    }

    @PermissionCallback
    private void notificationsResult(PluginCall call) {
        // The status notification only appears once notifications are allowed; refresh it.
        if (UnlockPrefs.isEnabled(getContext())) UnlockLaunchService.start(getContext());
        call.resolve(status());
    }

    private Uri packageUri() {
        return Uri.parse("package:" + getContext().getPackageName());
    }

    private void openSettings(PluginCall call, Intent primary, Intent fallback) {
        try {
            startSettings(primary);
            call.resolve();
        } catch (RuntimeException first) {
            if (fallback == null) {
                call.reject("설정 화면을 열 수 없어요.");
                return;
            }
            try {
                startSettings(fallback);
                call.resolve();
            } catch (RuntimeException second) {
                call.reject("설정 화면을 열 수 없어요.");
            }
        }
    }

    private void startSettings(Intent intent) {
        getActivity().startActivity(intent);
    }
}
