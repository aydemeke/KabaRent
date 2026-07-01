package com.kabarent.notification;

import java.util.Map;

public record NotificationRequest(
    NotificationType type,
    NotificationRecipient recipient,
    Map<String, String> payload
) {}
