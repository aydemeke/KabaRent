package com.kabarent.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
public class AdminOrderNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(AdminOrderNotificationListener.class);

    private final NotificationSender notificationSender;
    private final String adminEmail;

    public AdminOrderNotificationListener(
            NotificationSender notificationSender,
            @Value("${app.admin.email}") String adminEmail) {
        this.notificationSender = notificationSender;
        this.adminEmail = adminEmail;
    }

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        try {
            NotificationRequest request = new NotificationRequest(
                    NotificationType.ORDER_CREATED_ADMIN,
                    new NotificationRecipient("Admin", null, adminEmail),
                    Map.of(
                            "orderId", String.valueOf(event.orderId()),
                            "customerName", event.customerName(),
                            "customerPhone", event.customerPhone(),
                            "totalPrice", event.totalPrice().toPlainString(),
                            "eventDate", event.eventDate().toString(),
                            "returnDate", event.returnDate().toString()
                    )
            );
            notificationSender.send(request);
        } catch (Exception e) {
            log.error("Failed to send ORDER_CREATED_ADMIN notification for order #{}: {}",
                    event.orderId(), e.getMessage(), e);
        }
    }
}
