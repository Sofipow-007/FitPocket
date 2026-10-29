import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { invalidarTodo } from "../lib/apiCache";
import ConPermiso from "./ConPermiso";
import AyudaTip from "./Ayuda/AyudaTip";
import DialogoConfirmacion from "./DialogoConfirmacion/DialogoConfirmacion";

const conRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("<ConPermiso>", () => {
  beforeEach(() => {
    invalidarTodo();
    localStorage.setItem("token", "t");
    globalThis.fetch = vi.fn(() => Promise.resolve({
      status: 200,
      json: () => Promise.resolve({ patentes: ["plan.ver", "usuarios.listar"] }),
    }));
  });

  test("muestra el contenido si el usuario tiene la patente", async () => {
    conRouter(<ConPermiso patente="usuarios.listar"><button>Admin</button></ConPermiso>);
    expect(await screen.findByRole("button", { name: "Admin" })).toBeInTheDocument();
  });

  test("lo oculta si no la tiene (y muestra el fallback)", async () => {
    conRouter(<ConPermiso patente="usuarios.borrar" fallback={<p>Sin acceso</p>}><button>Borrar</button></ConPermiso>);
    expect(await screen.findByText("Sin acceso")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Borrar" })).not.toBeInTheDocument();
  });

  test("mientras cargan los permisos no muestra nada", () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})); // nunca responde
    conRouter(<ConPermiso patente="plan.ver"><button>Plan</button></ConPermiso>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("sin sesión no muestra nada y no pide permisos", async () => {
    localStorage.removeItem("token");
    conRouter(<ConPermiso patente="plan.ver"><button>Plan</button></ConPermiso>);
    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("<AyudaTip>", () => {
  const renderTip = () => conRouter(
    <div>
      <AyudaTip etiqueta="Qué es la racha" texto="Días seguidos con checkin." ancla="racha" />
      <button>Afuera</button>
    </div>,
  );

  test("se abre y se cierra con clic, y avisa su estado con aria-expanded", async () => {
    const user = userEvent.setup();
    renderTip();
    const boton = screen.getByRole("button", { name: "Qué es la racha" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Días seguidos con checkin.")).not.toBeInTheDocument();

    await user.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    // el texto aparece dentro de una región role="status" (el lector de pantalla lo anuncia)
    expect(screen.getByRole("status")).toHaveTextContent("Días seguidos con checkin.");
    expect(screen.getByRole("link", { name: "Más en Ayuda" })).toHaveAttribute("href", "/ayuda#racha");

    await user.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "false");
  });

  test("con el teclado: Enter abre, Escape cierra y devuelve el foco", async () => {
    const user = userEvent.setup();
    renderTip();
    await user.tab();
    const boton = screen.getByRole("button", { name: "Qué es la racha" });
    expect(boton).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(boton).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(boton).toHaveFocus();
  });

  test("un clic afuera lo cierra", async () => {
    const user = userEvent.setup();
    renderTip();
    await user.click(screen.getByRole("button", { name: "Qué es la racha" }));
    await user.click(screen.getByRole("button", { name: "Afuera" }));
    expect(screen.queryByText("Días seguidos con checkin.")).not.toBeInTheDocument();
  });
});

describe("<DialogoConfirmacion>", () => {
  const renderDialogo = (props = {}) => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <DialogoConfirmacion
        titulo="¿Borrar tu cuenta?"
        texto="No se puede deshacer."
        textoConfirmar="Sí, borrar"
        textoOcupado="Borrando..."
        peligro
        onCancel={onCancel}
        onConfirm={onConfirm}
        {...props}
      />,
    );
    return { onCancel, onConfirm };
  };

  test("es un alertdialog con nombre y descripción, y el foco arranca en Cancelar", () => {
    renderDialogo();
    const dialogo = screen.getByRole("alertdialog", { name: "¿Borrar tu cuenta?" });
    expect(dialogo).toHaveAccessibleDescription("No se puede deshacer.");
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  test("Escape cancela y el botón de peligro confirma", async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = renderDialogo();
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Sí, borrar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("el foco no sale del diálogo con Tab", async () => {
    const user = userEvent.setup();
    renderDialogo();
    await user.tab();
    expect(screen.getByRole("button", { name: "Sí, borrar" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  test("mientras trabaja deshabilita los botones y Escape no cierra", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialogo({ ocupado: true });
    expect(screen.getByRole("button", { name: "Borrando..." })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("muestra el error como alerta", () => {
    renderDialogo({ error: "No se pudo borrar." });
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo borrar.");
  });
});
