// utils/exportUtils.js
const ExcelJS = require('exceljs');

/**
 * Экспорт дефектов в CSV
 */
function exportToCSV(defects) {
  const headers = [
    'ID',
    'Project',
    'Title',
    'Description',
    'Priority',
    'Status',
    'Assignee',
    'Reporter',
    'Due Date',
    'Created At',
    'Resolved At',
  ];

  const rows = defects.map((d) => [
    d.id,
    d.project?.name || 'N/A',
    d.title,
    d.description || '',
    d.priority,
    d.status,
    d.assignee?.username || 'Unassigned',
    d.reporter?.username || 'Unknown',
    d.dueDate ? new Date(d.dueDate).toLocaleDateString() : 'N/A',
    new Date(d.createdAt).toLocaleDateString(),
    d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString() : 'N/A',
  ]);

  // Формируем CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell).replace(/"/g, '""');
          return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')
            ? `"${cellStr}"`
            : cellStr;
        })
        .join(',')
    ),
  ].join('\n');

  return '\uFEFF' + csvContent; // BOM для корректного отображения кириллицы
}

/**
 * Экспорт дефектов в Excel
 */
async function exportToExcel(defects) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Defects');

  // Заголовки
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Project', key: 'project', width: 20 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Reporter', key: 'reporter', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 15 },
    { header: 'Resolved At', key: 'resolvedAt', width: 15 },
  ];

  // Стилизация заголовков
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' },
  };

  // Добавляем данные
  defects.forEach((d) => {
    worksheet.addRow({
      id: d.id,
      project: d.project?.name || 'N/A',
      title: d.title,
      description: d.description || '',
      priority: d.priority,
      status: d.status,
      assignee: d.assignee?.username || 'Unassigned',
      reporter: d.reporter?.username || 'Unknown',
      dueDate: d.dueDate ? new Date(d.dueDate).toLocaleDateString() : 'N/A',
      createdAt: new Date(d.createdAt).toLocaleDateString(),
      resolvedAt: d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString() : 'N/A',
    });
  });

  // Цветовое кодирование по приоритету
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const priority = row.getCell('priority').value;
      let color = 'FFFFFFFF';
      
      switch (priority) {
        case 'critical':
          color = 'FFFF0000';
          break;
        case 'high':
          color = 'FFFFA500';
          break;
        case 'medium':
          color = 'FFFFFF00';
          break;
        case 'low':
          color = 'FF90EE90';
          break;
      }
      
      row.getCell('priority').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  exportToCSV,
  exportToExcel,
};