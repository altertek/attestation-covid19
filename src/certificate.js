import { PDFDocument, StandardFonts, grayscale } from "pdf-lib";
import QRCode from "qrcode";
import "regenerator-runtime/runtime";
import pdfBase from "./base.pdf";

const generateQR = async text => {
  try {
    const opts = {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1
    };
    return QRCode.toDataURL(text, opts);
  } catch (err) {
    console.error(err);
    return null;
  }
};

function pad(str) {
  return String(str).padStart(2, "0");
}

function setDateNow(date) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // Les mois commencent à 0
  const day = pad(date.getDate());
  return { year, month, day };
}

function setReleaseDateTime() {
  const loadedDate = new Date();
  const { year, month, day } = setDateNow(loadedDate);

  const releaseDateInput = document.querySelector("#field-datesortie");
  releaseDateInput.value = `${year}-${month}-${day}`;

  const hour = pad(loadedDate.getHours());
  const minute = pad(loadedDate.getMinutes());

  const releaseTimeInput = document.querySelector("#field-heuresortie");
  releaseTimeInput.value = `${hour}:${minute}`;
}

function idealFontSize(font, text, maxWidth, minSize, defaultSize) {
  const currentSize = defaultSize;
  let textWidth = font.widthOfTextAtSize(text, defaultSize);

  while (textWidth > maxWidth && currentSize > minSize) {
    textWidth = font.widthOfTextAtSize(text, currentSize - 1);
  }

  return textWidth > maxWidth ? null : currentSize;
}

const getData = () => {
  const profile = {};
  const reasons = [];

  const inputs = Array.from(document.querySelectorAll("#form-profile input"));

  inputs.forEach(field => {
    if (field.id === "field-datesortie") {
      const dateSortie = field.value.split("-");
      profile[
        field.id.substring("field-".length)
      ] = `${dateSortie[2]}/${dateSortie[1]}/${dateSortie[0]}`;
    } else if (field.name === "field-reason") {
      if (field.checked) {
        reasons.push(field.value);
      }
    } else {
      profile[field.id.substring("field-".length)] = field.value;
    }
  });

  return { profile, reasons };
};

async function generatePdf(profile, reasons) {
  const generatedDate = new Date();
  const { year, month, day } = setDateNow(generatedDate);

  const creationDate = `${day}/${month}/${year}`;

  const hour = pad(generatedDate.getHours());
  const minute = pad(generatedDate.getMinutes());
  const creationHour = `${hour}h${minute}`;

  const {
    lastname,
    firstname,
    birthday,
    lieunaissance,
    address,
    zipcode,
    town,
    datesortie,
    heuresortie
  } = profile;
  const releaseHours = String(heuresortie).substring(0, 2);
  const releaseMinutes = String(heuresortie).substring(3, 5);

  const data = [
    `Cree le: ${creationDate} a ${creationHour}`,
    `Nom: ${lastname}`,
    `Prenom: ${firstname}`,
    `Naissance: ${birthday} a ${lieunaissance}`,
    `Adresse: ${address} ${zipcode} ${town}`,
    `Sortie: ${datesortie} a ${releaseHours}h${releaseMinutes}`,
    `Motifs: ${reasons}`
  ].join("; ");

  const existingPdfBytes = await fetch(pdfBase).then(res => res.arrayBuffer());

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const page1 = pdfDoc.getPages()[0];

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const drawText = (text, x, y, size = 11) => {
    page1.drawText(text, { x, y, size, font });
  };

  drawText(`${firstname} ${lastname}`, 123, 686);
  drawText(birthday, 123, 661);
  drawText(lieunaissance, 92, 638);
  drawText(`${address} ${zipcode} ${town}`, 134, 613);

  if (reasons.includes("travail")) {
    drawText("x", 76, 527, 19);
  }
  if (reasons.includes("courses")) {
    drawText("x", 76, 478, 19);
  }
  if (reasons.includes("sante")) {
    drawText("x", 76, 436, 19);
  }
  if (reasons.includes("famille")) {
    drawText("x", 76, 400, 19);
  }
  if (reasons.includes("sport")) {
    drawText("x", 76, 345, 19);
  }
  if (reasons.includes("judiciaire")) {
    drawText("x", 76, 298, 19);
  }
  if (reasons.includes("missions")) {
    drawText("x", 76, 260, 19);
  }
  let locationSize = idealFontSize(font, profile.town, 83, 7, 11);

  if (!locationSize) {
    // eslint-disable-next-line no-alert
    alert(
      "Le nom de la ville risque de ne pas être affiché correctement en raison de sa longueur. " +
        'Essayez d\'utiliser des abréviations ("Saint" en "St." par exemple) quand cela est possible.'
    );
    locationSize = 7;
  }

  drawText(profile.town, 111, 226, locationSize);

  if (reasons !== "") {
    // Date sortie
    drawText(`${profile.datesortie}`, 92, 200);
    drawText(releaseHours, 200, 201);
    drawText(releaseMinutes, 220, 201);
  }

  // Date création
  drawText("Date de création:", 464, 150, 7);
  drawText(`${creationDate} à ${creationHour}`, 455, 144, 7);

  const generatedQR = await generateQR(data);

  const qrImage = await pdfDoc.embedPng(generatedQR);

  page1.drawImage(qrImage, {
    x: page1.getWidth() - 170,
    y: 155,
    width: 100,
    height: 100
  });
  page1.drawRectangle({
    x: 60,
    y: 150,
    width: 100,
    height: 15,
    color: grayscale(1)
  });

  pdfDoc.addPage();
  const page2 = pdfDoc.getPages()[1];
  page2.drawImage(qrImage, {
    x: 50,
    y: page2.getHeight() - 350,
    width: 300,
    height: 300
  });

  const pdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes], { type: "application/pdf" });

  const dateFileName = datesortie.split("/").join("-");
  const fileName = `${firstname[0]}${lastname[0]}_${dateFileName}_${releaseHours}h${releaseMinutes}.pdf`;

  return { blob, fileName };
}
const checkEmptyFields = (profile, reasons) => {
  const emptyFields = [];

  Object.entries(profile).forEach(([key, value]) => {
    if (value === "") emptyFields.push(key);
  });

  if (reasons.length === 0) {
    emptyFields.push("reason");
  }

  return emptyFields;
};

const errorCheck = (profile, reasons) => {
  const errorField = document.getElementById("error");
  const requiredFields = {
    firstname: "Prénom",
    lastname: "Nom",
    birthday: "Date de naissance",
    lieunaissance: "Lieu de naissance",
    address: "Adresse",
    town: "Ville",
    zipcode: "Code postal",
    reason: "Motif de sortie"
  };

  const emptyFields = checkEmptyFields(profile, reasons);

  if (emptyFields.length === 0) {
    errorField.style.visibility = "hidden";

    const buttons = Array.from(document.getElementsByClassName("generate"));
    buttons.forEach(button => {
      // eslint-disable-next-line no-param-reassign
      button.className = "generate";
    });

    return true;
  }

  const errorString = emptyFields
    .map(field => requiredFields[field])
    .join(", ");

  errorField.innerHTML = `Veuillez remplir les champs suivants: ${errorString}`;
  errorField.style.visibility = "visible";

  const buttons = Array.from(document.getElementsByClassName("generate"));
  buttons.forEach(button => {
    // eslint-disable-next-line no-param-reassign
    button.className = "generate button-outline";
  });

  return false;
};

function addSlash() {
  const birthdayField = document.getElementById("field-birthday");
  birthdayField.value = birthdayField.value
    .replace(/^(\d{2})$/g, "$1/")
    .replace(/^(\d{2})\/(\d{2})$/g, "$1/$2/")
    .replace(/\/\//g, "/");
}

const createPDFLink = (blob, fileName) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
};

const getPDF = async () => {
  const { profile, reasons } = getData();
  if (errorCheck(profile, reasons) === false) {
    return;
  }
  const { blob, fileName } = await generatePdf(profile, reasons);
  createPDFLink(blob, fileName);
};

const showPDF = async () => {
  const { profile, reasons } = getData();
  if (errorCheck(profile, reasons) === false) {
    return;
  }

  const { blob } = await generatePdf(profile, reasons);
  const url = URL.createObjectURL(blob);
  window.location.assign(url);
};

document.getElementById("getPDF").addEventListener("click", async event => {
  event.preventDefault();
  getPDF();
});
document.getElementById("showPDF").addEventListener("click", async event => {
  event.preventDefault();
  showPDF();
});

document.addEventListener("DOMContentLoaded", setReleaseDateTime);

document.getElementById("field-birthday").addEventListener("keyup", event => {
  const key = event.keyCode || event.charCode;
  const backspaceDeleteKey = 8;
  const deleteKey = 46;

  if (key === backspaceDeleteKey || key === deleteKey) return;
  addSlash();
});
