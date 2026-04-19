package com.kabarent.repository;

import com.kabarent.model.Payment;
import com.kabarent.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByOrderId(Long orderId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.id = :orderId AND p.status = :status")
    BigDecimal sumAmountByOrderIdAndStatus(@Param("orderId") Long orderId, @Param("status") PaymentStatus status);
}
