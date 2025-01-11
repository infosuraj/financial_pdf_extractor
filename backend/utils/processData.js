function processData(rawData) {
    const lines = rawData.split('\n');
    const periods = [];
    const financialItems = [];
    let currentSection = null;
  
    lines.forEach(line => {
      const columns = line.split('\t');
      const hasData = columns.some(col => col !== '0');
      const isTitle = columns.filter(col => col === '0').length === columns.length - 1;
  
      if (isTitle) {
        currentSection = columns[0];
      } else if (hasData) {
        const item = {
          section: currentSection,
          particulars: columns[0],
          values: columns.slice(2) // Adjust slice based on your columns structure
        };
        financialItems.push(item);
      }
    });
  
    return { periods, financialItems };
  }

  module.exports = processData;