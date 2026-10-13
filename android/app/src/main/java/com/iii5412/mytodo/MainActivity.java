package com.iii5412.mytodo;

import android.content.Intent;
import android.os.Bundle;

import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static volatile boolean foreground;
    private boolean pendingUnlockEvent;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UnlockLaunchPlugin.class);
        super.onCreate(savedInstanceState);
        paintWebViewBackground();
    }

    /** The WebView is white until its first frame; match the theme so opening on unlock never flashes white. */
    private void paintWebViewBackground() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(ContextCompat.getColor(this, R.color.app_bg));
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getBooleanExtra(UnlockLaunchService.EXTRA_FROM_UNLOCK, false)) {
            pendingUnlockEvent = true;
            if (foreground) fireUnlockEvent();
        }
    }

    private void fireUnlockEvent() {
        if (!pendingUnlockEvent || getBridge() == null) return;
        pendingUnlockEvent = false;
        getBridge().triggerWindowJSEvent("mytodoUnlock");
    }

    @Override
    public void onResume() {
        super.onResume();
        foreground = true;
        UnlockLaunchService.clearLegacyReminder(this);
        // Fired after the WebView is running again so the page can return to the list.
        fireUnlockEvent();
    }

    @Override
    public void onPause() {
        foreground = false;
        super.onPause();
    }
}
