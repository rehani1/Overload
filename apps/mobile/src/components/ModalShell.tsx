import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/theme/ThemeProvider";

type ModalShellProps = {
  children: ReactNode;
  closeAccessibilityLabel: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  eyebrow?: string;
  headerStyle?: StyleProp<ViewStyle>;
  onClose: () => void;
  presentationStyle?: ModalProps["presentationStyle"];
  safeAreaEdges?: Edge[];
  title: string;
  visible: boolean;
};

export function ModalShell({
  children,
  closeAccessibilityLabel,
  contentContainerStyle,
  eyebrow,
  headerStyle,
  onClose,
  presentationStyle = "pageSheet",
  safeAreaEdges = ["top"],
  title,
  visible,
}: ModalShellProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={presentationStyle}
      visible={visible}
    >
      <SafeAreaView edges={safeAreaEdges} style={styles.screen}>
        <View style={[styles.header, headerStyle]}>
          <View style={styles.titleGroup}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text numberOfLines={2} style={styles.title}>
              {title}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={closeAccessibilityLabel}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon color={colors.text} name="x-mark" size={20} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    header: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    titleGroup: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    eyebrow: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      letterSpacing: 0,
      lineHeight: typography.lineHeights.caption,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: typography.weights.bold,
      lineHeight: 28,
    },
    closeButton: {
      alignItems: "center",
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    content: {
      gap: spacing.md,
      paddingBottom: spacing.xxxl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
  });
}
