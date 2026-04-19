package com.kabarent.repository;

import com.kabarent.model.Kaba;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KabaRepository extends JpaRepository<Kaba, Long> {

    List<Kaba> findByActiveTrue();

    List<Kaba> findByActiveTrueAndCategory(String category);

    List<Kaba> findByActiveTrueAndSize(String size);

    List<Kaba> findByActiveTrueAndCategoryAndSize(String category, String size);
}
