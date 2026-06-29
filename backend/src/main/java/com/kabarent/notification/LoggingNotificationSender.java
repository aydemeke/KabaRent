package com.kabarent.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingNotificationSender.class);

    @Override
    public void send(NotificationRequest request) {
        NotificationRecipient r = request.recipient();
        // Step 2: a real sender should check r.email() vs r.phone() to pick channel (email/SMS/WhatsApp).
        // A phone-only customer (null email) is the norm — the real impl must support phone-based delivery.
        String contact = r.email() != null
                ? r.phone() + " / " + r.email()
                : r.phone();

        log.info("[PLACEHOLDER] Would send {} to {} ({}) | payload: {}",
                request.type(), r.name(), contact, request.payload());
    }
}
