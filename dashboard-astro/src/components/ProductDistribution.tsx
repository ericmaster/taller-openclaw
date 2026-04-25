import { useEffect, useRef, useState } from 'preact/hooks';
import Chart from 'chart.js/auto';

interface ProductDistributionProps {
  leads: Array<{
    producto_interes: string;
  }>;
}

export default function ProductDistribution({ leads }: ProductDistributionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    setError(null);

    try {
      // Contar leads por producto
      const productCounts: Record<string, number> = {};
      leads.forEach(lead => {
        const product = lead.producto_interes;
        productCounts[product] = (productCounts[product] || 0) + 1;
      });

      console.log('ProductDistribution counts:', productCounts);

      const labels = Object.keys(productCounts);
      const data = Object.values(productCounts);

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        setError('No se pudo obtener contexto 2D del canvas');
        return;
      }

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            label: 'Leads por producto',
            data,
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(139, 92, 246, 0.7)',
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'right',
            }
          }
        }
      });
    } catch (err) {
      console.error('Error creando ProductDistribution:', err);
      setError('Error al crear el gráfico: ' + (err as Error).message);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [leads]);

  return (
    <div style="position: relative; height: 300px; width: 100%;">
      {error && (
        <div class="bg-red-100 text-red-800 p-4 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      <canvas ref={canvasRef} />
    </div>
  );
}