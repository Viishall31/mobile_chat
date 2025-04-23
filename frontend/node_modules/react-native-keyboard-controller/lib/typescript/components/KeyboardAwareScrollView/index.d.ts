import React from "react";
import type { ScrollView, ScrollViewProps } from "react-native";
export type KeyboardAwareScrollViewProps = {
    /** The distance between keyboard and focused `TextInput` when keyboard is shown. Default is `0`. */
    bottomOffset?: number;
    /** Prevents automatic scrolling of the `ScrollView` when the keyboard gets hidden, maintaining the current screen position. Default is `false`. */
    disableScrollOnKeyboardHide?: boolean;
    /** Controls whether this `KeyboardAwareScrollView` instance should take effect. Default is `true` */
    enabled?: boolean;
    /** Adjusting the bottom spacing of KeyboardAwareScrollView. Default is `0` */
    extraKeyboardSpace?: number;
    /** Custom component for `ScrollView`. Default is `ScrollView` */
    ScrollViewComponent?: React.ComponentType<ScrollViewProps>;
} & ScrollViewProps;
declare const KeyboardAwareScrollView: React.ForwardRefExoticComponent<{
    /** The distance between keyboard and focused `TextInput` when keyboard is shown. Default is `0`. */
    bottomOffset?: number;
    /** Prevents automatic scrolling of the `ScrollView` when the keyboard gets hidden, maintaining the current screen position. Default is `false`. */
    disableScrollOnKeyboardHide?: boolean;
    /** Controls whether this `KeyboardAwareScrollView` instance should take effect. Default is `true` */
    enabled?: boolean;
    /** Adjusting the bottom spacing of KeyboardAwareScrollView. Default is `0` */
    extraKeyboardSpace?: number;
    /** Custom component for `ScrollView`. Default is `ScrollView` */
    ScrollViewComponent?: React.ComponentType<ScrollViewProps>;
} & ScrollViewProps & {
    children?: React.ReactNode | undefined;
} & React.RefAttributes<ScrollView>>;
export default KeyboardAwareScrollView;
