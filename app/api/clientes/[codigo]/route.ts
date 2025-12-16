import { NextResponse } from "next/server";
import { getClientePorCodigo } from "@/lib/kv";

export async function GET(
  _req: Request,
  { params }: { params: { codigo: string } }
) {
  try {
    const cliente = await getClientePorCodigo(params.codigo);

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
