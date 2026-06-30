package com.kabarent.notification;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(prefix = "app.notifications", name = "provider", havingValue = "resend")
public class ResendNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(ResendNotificationSender.class);
    private static final String RESEND_URL = "https://api.resend.com/emails";

    private final String apiKey;
    private final String from;
    private final RestClient restClient;

    public ResendNotificationSender(
            @Value("${app.resend.api-key}") String apiKey,
            @Value("${app.resend.from}") String from) {
        this.apiKey = apiKey;
        this.from = from;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(5000);

        this.restClient = RestClient.builder()
                .baseUrl(RESEND_URL)
                .requestFactory(requestFactory)
                .build();
    }

    @PostConstruct
    void validateConfig() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "app.notifications.provider=resend requires RESEND_API_KEY to be set");
        }
    }

    @Override
    public void send(NotificationRequest request) {
        NotificationRecipient recipient = request.recipient();
        if (recipient.email() == null || recipient.email().isBlank()) {
            log.info("Skipping email for {}: no email on file (phone-only customer)", recipient.name());
            return;
        }

        if (request.type() != NotificationType.ORDER_CREATED) {
            log.warn("ResendNotificationSender has no template for notification type {}", request.type());
            return;
        }

        try {
            String subject = buildOrderCreatedSubject(request.payload());
            String html = buildOrderCreatedHtml(recipient, request.payload());

            Map<String, Object> body = Map.of(
                    "from", from,
                    "to", List.of(recipient.email()),
                    "subject", subject,
                    "html", html
            );

            restClient.post()
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Sent {} email to {} for order #{}",
                    request.type(), recipient.email(), request.payload().get("orderId"));
        } catch (RestClientException e) {
            log.error("Failed to send {} email to {} for order #{}: {}",
                    request.type(), recipient.email(), request.payload().get("orderId"), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending {} email to {} for order #{}: {}",
                    request.type(), recipient.email(), request.payload().get("orderId"), e.getMessage(), e);
        }
    }

    private String buildOrderCreatedSubject(Map<String, String> payload) {
        return "אישור הזמנה #" + payload.get("orderId") + " - KabaRent";
    }

    private String buildOrderCreatedHtml(NotificationRecipient recipient, Map<String, String> payload) {
        return """
                <div dir="rtl" style="font-family: sans-serif; text-align: right;">
                  <h2>תודה על ההזמנה, %s!</h2>
                  <p>ההזמנה שלך התקבלה ומחכה לאישור.</p>
                  <ul>
                    <li>מספר הזמנה: %s</li>
                    <li>תאריך האירוע: %s</li>
                    <li>תאריך החזרה: %s</li>
                    <li>סכום כולל: %s ₪</li>
                  </ul>
                  <p>נעדכן אותך כשההזמנה תאושר.</p>
                </div>
                """.formatted(
                recipient.name(),
                payload.get("orderId"),
                payload.get("eventDate"),
                payload.get("returnDate"),
                payload.get("totalPrice")
        );
    }
}
