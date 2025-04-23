import type { FocusedInputEventsModule, KeyboardControllerNativeModule, KeyboardControllerProps, KeyboardEventsModule, KeyboardGestureAreaProps, OverKeyboardViewProps, WindowDimensionsEventsModule } from "./types";
export declare const KeyboardControllerNative: KeyboardControllerNativeModule;
export declare const KeyboardEvents: KeyboardEventsModule;
/**
 * This API is not documented, it's for internal usage only (for now), and is a subject to potential breaking changes in future.
 * Use it with cautious.
 */
export declare const FocusedInputEvents: FocusedInputEventsModule;
export declare const WindowDimensionsEvents: WindowDimensionsEventsModule;
export declare const KeyboardControllerView: React.FC<KeyboardControllerProps>;
export declare const KeyboardGestureArea: React.FC<KeyboardGestureAreaProps>;
export declare const RCTOverKeyboardView: React.FC<OverKeyboardViewProps>;
