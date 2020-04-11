function getTemplate({ firstName, lastName, birthDate, birthPlace, address }) {
  const template = `
  <div id="capture" style="width: 210mm; height: 297mm">
  <h1>ATTESTATION DE DEPLACEMENT DEROGATOIRE</h1>
<br>
<p>En application de l'article 3 du décret du 23 mars 2020 prescrivant les mesures générales nécessaires pour faire face à l'épidémie de Covid19 dans le cadre de l'état d'urgence sanitaire</p>
<br>
<p>Je soussigné(e),</p>
<br>
<p>Mme/M.:${firstName} ${lastName}</p>
<p>Né(e) le: ${birthDate}</p>
<p>à : ${birthPlace}</p>
<p>Demeurant : ${address}</p>
<p>certifie que mon déplacement est lié au motif suivant (cocher la case) autorisé par l'article 3 du décret du 23 mars 2020 prescrivant les mesures générales nécessaires pour faire face à l'épidémie de Covid19 dans le cadre de l'état d'urgence sanitaire<sup>1</sup>:</p>
<br>
<p>[ ] Déplacements entre le domicile et le lieu d'exercice de l'activité professionnelle, lorsqu'ils sont indispensables à l'exercice d'activités ne pouvant être organisées sous forme de télétravail ou déplacements professionnels ne pouvant être différés<sup>2</sup>.</p>
<br>
<p>[ ] Déplacements pour effectuer des achats de fournitures nécessaires à l'activité professionnelle et des achats de première nécessité<sup>3</sup></a> dans des établissements dont les activités demeurent autorisées (liste sur gouvernement.fr).</p>
<br>
<p>[ ] Consultations et soins ne pouvant être assurés à distance et ne pouvant être différés ; consultations et soins des patients atteints d'une affection de longue durée.</p>
<br>
<p>[ ] Déplacements pour motif familial impérieux, pour l'assistance aux personnes vulnérables ou la garde d'enfants.</p>
<br>
<p>[ ] Déplacements brefs, dans la limite d'une heure quotidienne et dans un rayon maximal d'un kilomètre autour du domicile, liés soit à l'activité physique individuelle des personnes, à l'exclusion de toute pratique sportive collective et de toute proximité avec d'autres personnes, soit à la promenade avec les seules personnes regroupées dans un même domicile, soit aux besoins des animaux de compagnie.</p>
<br>
<p>[ ] Convocation judiciaire ou administrative.</p>
<br>
<p>[ ] Participation à des missions d'intérêt général sur demande de l'autorité administrative.</p>
<br>
<br>
<p>Fait à:</p>
<br>
<p>Le: à h</p>
<p>(Date et heure de début de sortie à mentionner obligatoirement</p>
<br>
<p>
1. Les personnes souhaitant bénéficier de l'une de ces exceptions doivent se munir s'il y a lieu, lors de leurs déplacements hors de leur domicile, d'un document leur permettant de justifier que le déplacement considéré entre dans le champ de l'une de ces exceptions.<br>
2. A utiliser par les travailleurs non-salariés, lorsqu'ils ne peuvent disposer d'un justificatif de déplacement établi par leur employeur<br>
3. Y compris les acquisitions à titre gratuit (distribution de denrées alimentaires&hellip;) et les déplacements liés à la perception de prestations sociales et au retrait d'espèces.
</p>
</div>
  `
  return template
}


function generatePdf() {
  const htmlString = getTemplate({ firstName: "Jean", lastName: "Dupont", birthDate: "01/02/1970", birthPlace: "Test", address: "Ici" })
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  setTimeout(function(){
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.body.innerHTML = htmlString;
    html2canvas(iframeDoc.body).then(canvas => {
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'png', 0, 0);
      pdf.save('sample.pdf');
    });
  }, 10);
}
