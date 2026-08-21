import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_dimens.dart';
import '../../core/value_objects/money.dart';

class CurrencyDisplay extends StatelessWidget {
  final Money money;
  final TextStyle? style;
  final Color? color;
  final bool isLarge;

  const CurrencyDisplay({
    super.key,
    required this.money,
    this.style,
    this.color,
    this.isLarge = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveStyle = style ??
        (isLarge
            ? TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color ?? AppColors.textPrimary,
              )
            : TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: color ?? AppColors.textPrimary,
              ));

    return Text(
      money.formatted,
      style: effectiveStyle,
    );
  }
}

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isSecondary;
  final IconData? icon;
  final Color? backgroundColor;

  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.isSecondary = false,
    this.icon,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    if (isSecondary) {
      return OutlinedButton(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(AppDimens.buttonHeight),
          side: BorderSide(color: backgroundColor ?? AppColors.primaryGreen),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
          ),
        ),
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[Icon(icon, size: 20), const SizedBox(width: 8)],
                  Text(label, style: TextStyle(color: backgroundColor ?? AppColors.primaryGreen, fontWeight: FontWeight.bold)),
                ],
              ),
      );
    }

    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(AppDimens.buttonHeight),
        backgroundColor: backgroundColor ?? AppColors.primaryGreen,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
        ),
      ),
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (icon != null) ...[Icon(icon, size: 20, color: Colors.white), const SizedBox(width: 8)],
                Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
    );
  }
}

class AppTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final TextInputType keyboardType;
  final bool obscureText;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final ValueChanged<String>? onChanged;
  final String? Function(String?)? validator;

  const AppTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.prefixIcon,
    this.suffixIcon,
    this.onChanged,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary),
        ),
        const SizedBox(height: AppDimens.spacing4),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          onChanged: onChanged,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: AppColors.primaryGreen) : null,
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: AppColors.surfaceLight,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
              borderSide: const BorderSide(color: AppColors.borderLight),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
              borderSide: const BorderSide(color: AppColors.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimens.radiusMedium),
              borderSide: const BorderSide(color: AppColors.primaryGreen, width: 2),
            ),
          ),
        ),
      ],
    );
  }
}
