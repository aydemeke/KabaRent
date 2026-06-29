package com.kabarent.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationSender notificationSender;

    public NotificationEventListener(NotificationSender notificationSender) {
        this.notificationSender = notificationSender;
    }

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        try {
            NotificationRequest request = new NotificationRequest(
                    NotificationType.ORDER_CREATED,
                    new NotificationRecipient(
                            event.customerName(),
                            event.customerPhone(),
                            event.customerEmail()
                    ),
                    Map.of(
                            "orderId", String.valueOf(event.orderId()),
                            "totalPrice", event.totalPrice().toPlainString(),
                            "eventDate", event.eventDate().toString(),
                            "returnDate", event.returnDate().toString()
                    )
            );
            notificationSender.send(request);
        } catch (Exception e) {
            log.error("Failed to send ORDER_CREATED notification for order #{}: {}",
                    event.orderId(), e.getMessage(), e);
        }
    }
}
