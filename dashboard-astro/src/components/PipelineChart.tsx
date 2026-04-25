import { useEffect, useRef, useState } from 'preact/hooks';
import Chart from 'chart.js/auto';

interface PipelineChartProps {
  leads: Array<{
    estado: string;
  }>;
}

export default function PipelineChart({ leads }: PipelineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    setError(null);

    try {
      // Contar leads por estado
      const counts = {
        'nuevo lead': 0,
        'en seguimiento': 0,
        'cerrado': 0,
      };
      
      leads.forEach(lead => {
        if (lead.estado in counts) {
          counts[lead.estado as keyof typeof counts]++;
        }
      });

      console.log('PipelineChart counts:', counts);

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        setError('No se pudo obtener contexto 2D del canvas');
        return;
      }

      // Destruir gráfico anterior si existe
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Nuevo lead', 'En seguimiento', 'Cerrado'],
          datasets: [{
            label: 'Cantidad de leads',
            data: [counts['nuevo lead'], counts['en seguimiento'], counts['cerrado']],
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',  // azul
              'rgba(245, 158, 11, 0.7)',   // amarillo
              'rgba(139, 92, 246, 0.7)',   // violeta
            ],
            borderColor: [
              'rgb(59, 130, 246)',
              'rgb(245, 158, 11)',
              'rgb(139, 92, 246)',
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('Error creando PipelineChart:', err);
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