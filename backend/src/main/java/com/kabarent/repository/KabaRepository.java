package com.kabarent.repository;

import com.kabarent.model.Kaba;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KabaRepository extends JpaRepository<Kaba, Long> {

    List<Kaba> findByActiveTrue();

    List<Kaba> findByActiveTrueAndCategory(String category);

    List<Kaba> findByActiveTrueAndSize(String size);

    List<Kaba> findByActiveTrueAndCategoryAndSize(String category, String size);

    // Acquires a row-level write lock on the Kaba so concurrent order confirmations
    // for the same Kaba are serialized, closing the availability race condition.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT k FROM Kaba k WHERE k.id = :id")
    Optional<Kaba> findByIdWithLock(@Param("id") Long id);
}
