package com.iii5412.mytodo;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Bridge for the unlock switch, overlay permission and battery settings. */
@CapacitorPlugin(name = "UnlockLaunch")
public class UnlockLaunchPlugin extends Plugin {

    private JSObject status() {
        Context context = getContext();
        PowerManager power = context.getSystemService(PowerManager.class);
        JSObject result = new JSObject();
        result.put("enabled", UnlockPrefs.isEnabled(context));
        result.put("overlayGranted", Settings.canDrawOverlays(context));
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
