// frontend/src/features/vocabulary/services/vocabulary.service.ts
import { apiClient } from "@/lib/api/client";
import {
  VocabularySet,
  CreateVocabularySetDTO,
  UpdateVocabularySetDTO,
  AddTermDTO,
  UpdateTermDTO,
} from "../types/vocabulary.types";

const BASE_URL = "/api/vocabulary";

export const vocabularyService = {
  async getVocabularySets(): Promise<VocabularySet[]> {
    const response = await apiClient.get<VocabularySet[]>(BASE_URL);
    return response.data;
  },

  async getVocabularySetById(setId: string): Promise<VocabularySet> {
    const response = await apiClient.get<VocabularySet>(`${BASE_URL}/${setId}`);
    return response.data;
  },

  async createVocabularySet(
    data: CreateVocabularySetDTO
  ): Promise<VocabularySet> {
    const response = await apiClient.post<VocabularySet>(BASE_URL, data);
    return response.data;
  },

  async updateVocabularySet(
    setId: string,
    data: UpdateVocabularySetDTO
  ): Promise<VocabularySet> {
    const response = await apiClient.put<VocabularySet>(
      `${BASE_URL}/${setId}`,
      data
    );
    return response.data;
  },

  async deleteVocabularySet(setId: string): Promise<void> {
    const response = await apiClient.delete(`${BASE_URL}/${setId}`);
    // DELETE returns { message: ... } but we don't need it
    return;
  },

  async addTerm(setId: string, term: AddTermDTO): Promise<VocabularySet> {
    const response = await apiClient.post<VocabularySet>(
      `${BASE_URL}/${setId}/term`,
      term
    );
    return response.data;
  },

  async updateTerm(
    setId: string,
    termId: string,
    data: UpdateTermDTO
  ): Promise<VocabularySet> {
    const response = await apiClient.put<VocabularySet>(
      `${BASE_URL}/${setId}/term/${termId}`,
      data
    );
    return response.data;
  },

  async deleteTerm(setId: string, termId: string): Promise<VocabularySet> {
    const response = await apiClient.delete<VocabularySet>(
      `${BASE_URL}/${setId}/term/${termId}`
    );
    return response.data;
  },

  async shareVocabularySet(setId: string, isPublic: boolean): Promise<VocabularySet> {
    const response = await apiClient.patch<VocabularySet>(
      `${BASE_URL}/${setId}/share`,
      { isPublic }
    );
    return response.data;
  },

  async getPublicVocabularySets(page: number = 1, limit: number = 20, sortBy: 'newest' | 'popular' = 'newest'): Promise<{ sets: VocabularySet[]; total: number; page: number; limit: number }> {
    const response = await apiClient.get<{ sets: VocabularySet[]; total: number; page: number; limit: number }>(
      `${BASE_URL}/public-sets?page=${page}&limit=${limit}&sortBy=${sortBy}`
    );
    return response.data;
  },

  async cloneVocabularySet(setId: string): Promise<VocabularySet> {
    const response = await apiClient.post<VocabularySet>(
      `${BASE_URL}/${setId}/clone`
    );
    return response.data;
  },
};
