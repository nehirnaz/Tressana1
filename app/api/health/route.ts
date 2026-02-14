import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/health — checks server + database connection
export async function GET() {
  try {
    const [salons, products, hairstyles] = await Promise.all([
      supabase.from('salons').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('hairstyles').select('id', { count: 'exact', head: true }),
    ]);

    const errors = [
      salons.error && `salons: ${salons.error.message}`,
      products.error && `products: ${products.error.message}`,
      hairstyles.error && `hairstyles: ${hairstyles.error.message}`,
    ].filter(Boolean);

    return NextResponse.json({
      status: errors.length > 0 ? 'partial' : 'ok',
      errors: errors.length > 0 ? errors : undefined,
      data: {
        salons: salons.count || 0,
        products: products.count || 0,
        hairstyles: hairstyles.count || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
