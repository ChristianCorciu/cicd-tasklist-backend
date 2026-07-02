// À placer dans : src/__tests__/task.routes.test.ts (backend)
//
// Ces tests montent l'app Express réelle et mockent uniquement task.service,
// pour vérifier le comportement HTTP des routes/controller (statuts, validations, erreurs)
// sans dépendre d'une vraie base de données.

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import * as taskService from "../services/task.service.js";

vi.mock("../services/task.service.js");

const fakeTask = {
  id: 1,
  title: "Tâche test",
  description: "Description",
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("API /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tasks", () => {
    it("renvoie 200 et la liste des tâches", async () => {
      vi.mocked(taskService.findAll).mockResolvedValue([fakeTask] as any);

      const res = await request(app).get("/api/tasks");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([fakeTask]);
    });

    it("renvoie 500 si le service échoue", async () => {
      vi.mocked(taskService.findAll).mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/tasks");

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("renvoie 200 et la tâche si elle existe", async () => {
      vi.mocked(taskService.findById).mockResolvedValue(fakeTask as any);

      const res = await request(app).get("/api/tasks/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeTask);
    });

    it("renvoie 404 si la tâche n'existe pas", async () => {
      vi.mocked(taskService.findById).mockResolvedValue(null);

      const res = await request(app).get("/api/tasks/999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Task not found");
    });

    it("renvoie 400 si l'id n'est pas un nombre", async () => {
      const res = await request(app).get("/api/tasks/abc");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid task ID");
    });
  });

  describe("POST /api/tasks", () => {
    it("crée une tâche et renvoie 201", async () => {
      vi.mocked(taskService.create).mockResolvedValue(fakeTask as any);

      const res = await request(app)
        .post("/api/tasks")
        .send({ title: "Tâche test", description: "Description" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(fakeTask);
      expect(taskService.create).toHaveBeenCalledWith({
        title: "Tâche test",
        description: "Description",
      });
    });

    it("renvoie 400 si le titre est manquant", async () => {
      const res = await request(app).post("/api/tasks").send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Title is required/);
      expect(taskService.create).not.toHaveBeenCalled();
    });

    it("renvoie 400 si le titre est une chaîne vide", async () => {
      const res = await request(app).post("/api/tasks").send({ title: "   " });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("met à jour une tâche et renvoie 200", async () => {
      const updated = { ...fakeTask, title: "Titre modifié" };
      vi.mocked(taskService.update).mockResolvedValue(updated as any);

      const res = await request(app)
        .put("/api/tasks/1")
        .send({ title: "Titre modifié" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Titre modifié");
    });

    it("renvoie 404 si la tâche à mettre à jour n'existe pas", async () => {
      vi.mocked(taskService.update).mockRejectedValue(new Error("Task not found"));

      const res = await request(app).put("/api/tasks/999").send({ title: "X" });

      expect(res.status).toBe(404);
    });

    it("renvoie 400 si l'id n'est pas un nombre", async () => {
      const res = await request(app).put("/api/tasks/abc").send({ title: "X" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("supprime une tâche et renvoie 204", async () => {
      vi.mocked(taskService.remove).mockResolvedValue(fakeTask as any);

      const res = await request(app).delete("/api/tasks/1");

      expect(res.status).toBe(204);
    });

    it("renvoie 404 si la tâche à supprimer n'existe pas", async () => {
      vi.mocked(taskService.remove).mockRejectedValue(new Error("Task not found"));

      const res = await request(app).delete("/api/tasks/999");

      expect(res.status).toBe(404);
    });

    it("renvoie 400 si l'id n'est pas un nombre", async () => {
      const res = await request(app).delete("/api/tasks/abc");

      expect(res.status).toBe(400);
    });
  });
});
