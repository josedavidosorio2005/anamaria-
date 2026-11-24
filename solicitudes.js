(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const form = byId('quote-form');
  const preview = byId('request-preview');
  const share = byId('share-card');
  const download = byId('download-card');
  const chat = byId('chat-request');
  const status = byId('request-status');
  const whatsapp = chat.href;
  const timezone = { timeZone: 'America/Bogota' };
  let current;
  let imageBlob;

  function readForm() {
    const now = new Date();
    const day = new Intl.DateTimeFormat('en-CA', {
      ...timezone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const dateCode = ['year', 'month', 'day'].map(type => day.find(part => part.type === type).value).join('');
    const suffix = (crypto.getRandomValues(new Uint32Array(1))[0] % 100000).toString().padStart(5, '0');
    const value = id => byId(id).value.trim();

    return {
      service: new FormData(form).get('servicio'),
      client: value('client-name'),
      email: value('client-email'),
      phone: value('client-phone'),
      city: value('client-city'),
      mode: value('client-mode'),
      when: value('client-when'),
      details: value('client-message'),
      date: new Intl.DateTimeFormat('es-CO', { ...timezone, dateStyle: 'long' }).format(now),
      ref: 'AG-' + dateCode + '-' + suffix
    };
  }

  function summary(request) {
    const lines = [
      '*Solicitud de cotización para Ana María Gallego Betancur*',
      '*Referencia:* ' + request.ref,
      '',
      '*Servicio:* ' + request.service,
      '*Nombre o empresa:* ' + request.client,
      '*Correo:* ' + request.email,
      ...(request.phone ? ['*Teléfono:* ' + request.phone] : []),
      ...(request.city ? ['*Ciudad:* ' + request.city] : []),
      '*Modalidad:* ' + request.mode,
      '*Plazo:* ' + request.when,
      '',
      '*Descripción:*',
      request.details
    ];
    return lines.join('\n');
  }

  function showPreview(request) {
    const fields = {
      ...request,
      phone: request.phone || 'No indicado',
      city: request.city || 'No indicada'
    };
    for (const [key, value] of Object.entries(fields)) byId('pv-' + key).textContent = value;
    chat.href = whatsapp + '?text=' + encodeURIComponent(summary(request));
    preview.hidden = false;
    byId('preview-title').focus({ preventScroll: true });
    preview.scrollIntoView({ block: 'start' });
  }

  function wrapText(context, text, width) {
    const lines = [];
    for (const paragraph of text.split('\n')) {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      let line = '';
      for (const word of words) {
        const next = line ? line + ' ' + word : word;
        if (context.measureText(next).width <= width) {
          line = next;
          continue;
        }
        if (line) lines.push(line);
        line = '';
        if (context.measureText(word).width <= width) {
          line = word;
          continue;
        }
        for (const character of word) {
          if (line && context.measureText(line + character).width > width) {
            lines.push(line);
            line = '';
          }
          line += character;
        }
      }
      if (line || !words.length) lines.push(line);
    }
    return lines;
  }

  function createImage(request) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas no disponible');

    const ink = '#20291d';
    const pine = '#203520';
    const paper = '#fdfcf8';
    const sage = '#e4e9d8';
    const olive = '#52604f';
    const rule = '#d4d9c9';
    const width = 1200;

    context.font = '30px Arial, sans-serif';
    const rows = [
      [['Nombre o empresa', request.client], ['Correo electrónico', request.email]],
      [['Teléfono', request.phone || 'No indicado'], ['Ciudad', request.city || 'No indicada']],
      [['Modalidad', request.mode], ['Plazo estimado', request.when]]
    ].map(row => row.map(([label, value]) => ({
      label,
      lines: wrapText(context, value, 475)
    })));
    context.font = '33px Arial, sans-serif';
    let details = wrapText(context, request.details, 1036);
    if (details.length > 48) details = wrapText(context, request.details.replace(/\s+/g, ' '), 1036);
    const rowHeight = row => 82 + Math.max(...row.map(field => field.lines.length)) * 38;
    const height = 480 + rows.reduce((total, row) => total + rowHeight(row), 0) + details.length * 45 + 220;
    const scale = Math.min(1, 4000 / height);
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    context.scale(canvas.width / width, canvas.height / height);

    function fill(x, y, boxWidth, boxHeight, color) {
      context.fillStyle = color;
      context.fillRect(x, y, boxWidth, boxHeight);
    }

    function write(text, x, y, font, color) {
      context.fillStyle = color;
      context.font = font;
      context.fillText(text, x, y);
    }

    fill(0, 0, width, height, paper);
    fill(0, 0, width, 280, pine);
    fill(82, 59, 78, 78, sage);
    write('AG', 96, 111, '40px Georgia, serif', pine);
    write('ANA MARÍA GALLEGO BETANCUR', 184, 88, 'bold 23px Arial, sans-serif', paper);
    write('QUÍMICA FARMACÉUTICA', 184, 119, '20px Arial, sans-serif', sage);
    write('Solicitud de cotización', 79, 211, '67px Georgia, serif', paper);
    write(request.ref, 82, 251, '22px Arial, sans-serif', sage);

    fill(82, 324, 1036, 116, sage);
    write('SERVICIO DE INTERÉS', 106, 366, 'bold 20px Arial, sans-serif', olive);
    write(request.service, 106, 410, '39px Georgia, serif', pine);

    let rowTop = 480;
    for (const row of rows) {
      fill(82, rowTop, 1036, 2, rule);
      row.forEach(({ label, lines }, column) => {
        const x = 82 + 545 * column;
        write(label.toUpperCase(), x, rowTop + 35, 'bold 20px Arial, sans-serif', olive);
        lines.forEach((line, index) => write(line, x, rowTop + 77 + index * 38, '30px Arial, sans-serif', ink));
      });
      rowTop += rowHeight(row);
    }

    fill(82, rowTop, 1036, 2, rule);
    write('DESCRIPCIÓN DE LA NECESIDAD', 82, rowTop + 45, 'bold 20px Arial, sans-serif', olive);
    details.forEach((line, index) => write(line, 82, rowTop + 96 + index * 45, '33px Arial, sans-serif', ink));
    fill(0, height - 96, width, 96, pine);
    write('Ficha preparada el ' + request.date, 82, height - 39, '23px Arial, sans-serif', paper);
    write('ANA MARÍA GALLEGO BETANCUR', 725, height - 39, 'bold 20px Arial, sans-serif', sage);

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo crear la imagen')), 'image/png');
    });
  }

  function filename() {
    return 'Solicitud-Cotizacion-' + current.ref + '.png';
  }

  function downloadImage() {
    if (!imageBlob) return;
    const url = URL.createObjectURL(imageBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename();
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  for (const link of document.querySelectorAll('[data-service-link]')) {
    link.addEventListener('click', () => {
      const service = [...form.elements.servicio].find(input => input.value === link.dataset.serviceLink);
      if (service) service.checked = true;
    });
  }

  const requiredFields = [
    [byId('client-name'), 2, 'Escribe un nombre de al menos dos caracteres.'],
    [byId('client-message'), 10, 'Describe tu necesidad en al menos diez caracteres.']
  ];
  for (const [field] of requiredFields) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    for (const [field, length, message] of requiredFields) {
      field.setCustomValidity(field.value.trim().length >= length ? '' : message);
    }
    if (!form.reportValidity()) return;

    const request = readForm();
    current = request;
    imageBlob = null;
    share.disabled = true;
    download.disabled = true;
    status.textContent = 'Preparando la imagen de tu ficha…';
    showPreview(request);
    try {
      const blob = await createImage(request);
      if (current !== request) return;
      imageBlob = blob;
      share.disabled = false;
      download.disabled = false;
      status.textContent = 'Ficha lista. Abre WhatsApp para revisar el mensaje y enviarlo.';
    } catch {
      if (current === request) status.textContent = 'Tu resumen está disponible en WhatsApp. Este navegador no pudo crear la imagen.';
    }
  });

  download.addEventListener('click', downloadImage);

  share.addEventListener('click', async () => {
    if (!imageBlob) return;
    const request = current;
    const file = new File([imageBlob], filename(), { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Solicitud de cotización ' + request.ref });
        if (current === request) status.textContent = 'Ficha compartida con la aplicación elegida.';
      } catch (error) {
        if (current === request && error.name !== 'AbortError') {
          status.textContent = 'Descarga la ficha y adjúntala manualmente en WhatsApp.';
        }
      }
      return;
    }

    if (navigator.clipboard?.write && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': imageBlob })]);
        if (current === request) status.textContent = 'Imagen copiada. Abre WhatsApp, pega la ficha y confirma el envío.';
        return;
      } catch {
        // Browsers may block clipboard access even when the interface is available.
      }
    }

    if (current !== request) return;
    downloadImage();
    status.textContent = 'Imagen descargada. Puedes adjuntarla al mensaje de WhatsApp.';
  });

  form.hidden = false;
  byId('quote-fallback').hidden = true;
})();
