function extractTables(blocks) {
  const tableBlocks = blocks.filter(block => block.BlockType === "TABLE");
  const extractedTables = [];

  tableBlocks.forEach((table, index) => {
    const tableId = 'Table_' + (index + 1);
    const cells = table.Relationships ? table.Relationships[0].Ids.map(id => blocks.find(block => block.Id === id)) : [];
    const maxRow = Math.max(...cells.map(cell => cell.RowIndex || 0), 0);
    const maxCol = Math.max(...cells.map(cell => cell.ColumnIndex || 0), 0);
    const rows = [];
  
    for (let row = 1; row <= maxRow; row++) {
      const rowOutput = [];
      for (let col = 1; col <= maxCol; col++) {
        const cell = cells.find(cell => cell.RowIndex === row && cell.ColumnIndex === col);
        if (cell && cell.Relationships) {
          const text = cell.Relationships[0].Ids.map(id => blocks.find(block => block.Id === id)).map(word => word.Text ? word.Text.replace(/,/g, '') : '0').join(' ');
          rowOutput.push(text);
        } else {
          rowOutput.push('0');
        }
      }
      const hasData = rowOutput.some(col => col !== '0');
      if (hasData) {
        rows.push(rowOutput);
      }
    }
  
    extractedTables.push({ rows: rows });
    
  });
  const resultTables = extractedTables.map(table => {
    const firstRow = table.rows[0] || [];
    const notesPosition = firstRow.indexOf("Notes");
    if (notesPosition !== -1) {
      table.rows.forEach(row => row.splice(notesPosition, 1));
    }
    return table;
  });
  return resultTables;
}  

module.exports = extractTables;
