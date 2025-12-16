import { NextResponse, NextRequest } from "next/server";
import { getClientePorCodigo } from "@/lib/kv";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await context.params;

    const cliente = await getClientePorCodigo(codigo);

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      nome: cliente.nome,
      categoria: cliente.categoria,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
