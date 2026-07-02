// À placer dans : src/__tests__/task.service.test.ts (backend)
//
// Ces tests mockent le client Prisma pour ne PAS dépendre d'une vraie base de données.
// Adapte le chemin de mock ci-dessous si ton alias/import de prisma diffère.

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as taskService from "../services/task.service.js";

// Mock du client Prisma utilisé par task.service.ts
vi.mock("../lib/prisma.js", () => ({
  default: {
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "../lib/prisma.js";

describe("task.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("retourne la liste des tâches triées par date de création décroissante", async () => {
      const fakeTasks = [
        { id: 1, title: "Tâche 1", completed: false, createdAt: new Date() },
        { id: 2, title: "Tâche 2", completed: true, createdAt: new Date() },
      ];
      (prisma.task.findMany as any).mockResolvedValue(fakeTasks);

      const result = await taskService.findAll();

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(fakeTasks);
    });
  });

  describe("findById", () => {
    it("retourne la tâche correspondant à l'id", async () => {
      const fakeTask = { id: 1, title: "Tâche 1", completed: false };
      (prisma.task.findUnique as any).mockResolvedValue(fakeTask);

      const result = await taskService.findById(1);

      expect(prisma.task.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(fakeTask);
    });

    it("retourne null si la tâche n'existe pas", async () => {
      (prisma.task.findUnique as any).mockResolvedValue(null);

      const result = await taskService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("crée une nouvelle tâche avec titre et description", async () => {
      const input = { title: "Nouvelle tâche", description: "Détails" };
      const created = { id: 3, ...input, completed: false, createdAt: new Date() };
      (prisma.task.create as any).mockResolvedValue(created);

      const result = await taskService.create(input);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: { title: input.title, description: input.description },
      });
      expect(result).toEqual(created);
    });
  });

  describe("update", () => {
    it("met à jour une tâche existante", async () => {
      const existing = { id: 1, title: "Ancien titre", completed: false };
      const updated = { ...existing, title: "Nouveau titre" };
      (prisma.task.findUnique as any).mockResolvedValue(existing);
      (prisma.task.update as any).mockResolvedValue(updated);

      const result = await taskService.update(1, { title: "Nouveau titre" });

      expect(result).toEqual(updated);
    });

    it("lève une erreur si la tâche à mettre à jour n'existe pas", async () => {
      (prisma.task.findUnique as any).mockResolvedValue(null);

      await expect(taskService.update(999, { title: "X" })).rejects.toThrow(
        "Task not found"
      );
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("supprime une tâche existante", async () => {
      const existing = { id: 1, title: "À supprimer" };
      (prisma.task.findUnique as any).mockResolvedValue(existing);
      (prisma.task.delete as any).mockResolvedValue(existing);

      const result = await taskService.remove(1);

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(existing);
    });

    it("lève une erreur si la tâche à supprimer n'existe pas", async () => {
      (prisma.task.findUnique as any).mockResolvedValue(null);

      await expect(taskService.remove(999)).rejects.toThrow("Task not found");
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });
});
