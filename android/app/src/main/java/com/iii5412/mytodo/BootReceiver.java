package com.iii5412.mytodo;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Restarts the unlock watcher after a reboot or an app update, if the user left it switched on. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) return;
        if (!UnlockPrefs.isEnabled(context)) return;
        try {
            UnlockLaunchService.start(context);
        } catch (RuntimeException ignored) {
            // The system may refuse a background start; the user can reopen the app to restart it.
        }
    }
}
