package com.kabarent.service;

import com.kabarent.dto.request.KabaRequest;
import com.kabarent.dto.response.KabaResponse;
import com.kabarent.exception.ResourceNotFoundException;
import com.kabarent.model.Kaba;
import com.kabarent.repository.KabaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KabaService {

    private final KabaRepository kabaRepository;

    public List<KabaResponse> listActiveKabas(String category, String size) {
        List<Kaba> kabas;
        if (category != null && size != null) {
            kabas = kabaRepository.findByActiveTrueAndCategoryAndSize(category, size);
        } else if (category != null) {
            kabas = kabaRepository.findByActiveTrueAndCategory(category);
        } else if (size != null) {
            kabas = kabaRepository.findByActiveTrueAndSize(size);
        } else {
            kabas = kabaRepository.findByActiveTrue();
        }
        return kabas.stream().map(KabaResponse::from).toList();
    }

    public KabaResponse getById(Long id) {
        return KabaResponse.from(findOrThrow(id));
    }

    public KabaResponse create(KabaRequest request) {
        Kaba kaba = Kaba.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .size(request.getSize())
                .pricePerDay(request.getPricePerDay())
                .quantity(request.getQuantity())
                .imageUrl(request.getImageUrl())
                .build();
        return KabaResponse.from(kabaRepository.save(kaba));
    }

    public KabaResponse update(Long id, KabaRequest request) {
        Kaba kaba = findOrThrow(id);
        kaba.setName(request.getName());
        kaba.setDescription(request.getDescription());
        kaba.setCategory(request.getCategory());
        kaba.setSize(request.getSize());
        kaba.setPricePerDay(request.getPricePerDay());
        kaba.setQuantity(request.getQuantity());
        kaba.setImageUrl(request.getImageUrl());
        return KabaResponse.from(kabaRepository.save(kaba));
    }

    public void softDelete(Long id) {
        Kaba kaba = findOrThrow(id);
        kaba.setActive(false);
        kabaRepository.save(kaba);
    }

    public Kaba findOrThrow(Long id) {
        return kabaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kaba not found with id: " + id));
    }
}
