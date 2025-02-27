/**
 * Converts builder data to CSV format and triggers download
 * @param {Array} builders - Array of builder objects
 */
export const exportBuildersToCSV = (builders) => {
  // Define CSV headers
  const headers = [
    'Name',
    'Email',
    'Sections Completed',
    'Total Sections',
    'Progress %',
    'Last Update',
    'Status'
  ];

  // Transform builder data into CSV rows
  const rows = builders.map(builder => {
    const progress = (builder.progress.completed / builder.progress.total * 100).toFixed(1);
    const isActive = Date.now() - builder.lastUpdate < 300000; // Active in last 5 minutes
    
    return [
      builder.userInfo.name,
      builder.userInfo.email,
      builder.progress.completed,
      builder.progress.total,
      `${progress}%`,
      new Date(builder.lastUpdate).toLocaleString(),
      isActive ? 'Active' : 'Inactive'
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `builder-data-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}