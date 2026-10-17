/**
 * expo-notifications and expo-device are native modules. Installs made before push was added do not contain them,
 * and an over-the-air update reaches those installs too. Loading them defensively means those installs keep
 * working (without push) instead of crashing at launch.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
type NotificationsModule = typeof import("expo-notifications");
type DeviceModule = typeof import("expo-device");

let notifications: NotificationsModule | null = null;
let device: DeviceModule | null = null;
try {
  notifications = require("expo-notifications");
  device = require("expo-device");
} catch {
  notifications = null;
  device = null;
}

export const Notifications = notifications;
export const Device = device;
