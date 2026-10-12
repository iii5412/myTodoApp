package com.iii5412.mytodo;

import android.content.Context;
import android.content.SharedPreferences;

/** The "open on unlock" switch, kept natively so the boot receiver can read it without the WebView. */
final class UnlockPrefs {
    private static final String FILE = "mytodo_unlock";
    private static final String KEY_ENABLED = "enabled";

    private UnlockPrefs() {}

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    static boolean isEnabled(Context context) {
        return prefs(context).getBoolean(KEY_ENABLED, false);
    }

    static void setEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply();
    }
}
