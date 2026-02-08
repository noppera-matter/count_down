const form = document.getElementById("person-form");
const nameInput = document.getElementById("name");
const relationInput = document.getElementById("relation");
const descriptionInput = document.getElementById("description");
const notesInput = document.getElementById("notes");
const generateButton = document.getElementById("generate-image");
const previewImage = document.getElementById("preview-image");
const previewPlaceholder = document.getElementById("preview-placeholder");
const cardList = document.getElementById("card-list");
const emptyState = document.getElementById("empty-state");
const countLabel = document.getElementById("count");

const STORAGE_KEY = "memory-cards";
let currentPreview = "";
let previewTimer;

const loadEntries = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveEntries = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const wrapText = (context, text, maxWidth) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const { width } = context.measureText(testLine);
    if (width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
};

const generateImageCard = ({ name, relation, description }) => {
  const canvas = document.createElement("canvas");
  const size = 640;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#5f6ad8");
  gradient.addColorStop(1, "#c9cdf6");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.fillStyle = "rgba(255,255,255,0.9)";
  context.fillRect(40, 40, size - 80, size - 80);

  context.fillStyle = "#2b2f50";
  context.font = "bold 32px 'Pretendard', sans-serif";
  context.fillText(name, 80, 120);

  if (relation) {
    context.fillStyle = "#5f6ad8";
    context.font = "600 22px 'Pretendard', sans-serif";
    context.fillText(relation, 80, 160);
  }

  context.fillStyle = "#414665";
  context.font = "20px 'Pretendard', sans-serif";
  const lines = wrapText(context, description, size - 160);
  lines.slice(0, 9).forEach((line, index) => {
    context.fillText(line, 80, 220 + index * 28);
  });

  context.fillStyle = "#8a8fb0";
  context.font = "600 16px 'Pretendard', sans-serif";
  context.fillText("기억 카드", 80, size - 80);

  return canvas.toDataURL("image/png");
};

const updatePreview = (imageData) => {
  currentPreview = imageData;
  if (imageData) {
    previewImage.src = imageData;
    previewImage.style.display = "block";
    previewPlaceholder.style.display = "none";
  } else {
    previewImage.removeAttribute("src");
    previewImage.style.display = "none";
    previewPlaceholder.style.display = "block";
  }
};

const updatePlaceholder = (message) => {
  previewPlaceholder.textContent = message;
};

const resetForm = () => {
  form.reset();
  updatePreview("");
};

const renderCards = (entries) => {
  cardList.innerHTML = "";
  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "card";

    const image = document.createElement("img");
    image.src = entry.imageData;
    image.alt = `${entry.name} 기억 카드`;

    const title = document.createElement("h3");
    title.textContent = entry.name;

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = entry.relation ? entry.relation : "관계 미입력";

    const description = document.createElement("p");
    description.textContent = entry.description;

    const notes = document.createElement("p");
    notes.className = "meta";
    notes.textContent = entry.notes ? `메모: ${entry.notes}` : "메모 없음";

    const actions = document.createElement("div");
    actions.className = "actions";

    const removeButton = document.createElement("button");
    removeButton.className = "danger";
    removeButton.textContent = "삭제";
    removeButton.addEventListener("click", () => {
      const updated = loadEntries().filter((item) => item.id !== entry.id);
      saveEntries(updated);
      renderCards(updated);
    });

    actions.append(removeButton);
    card.append(image, title, meta, description, notes, actions);
    cardList.append(card);
  });

  countLabel.textContent = `${entries.length}명 저장됨`;
  emptyState.style.display = entries.length ? "none" : "block";
};

const handleGenerate = () => {
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!name || !description) {
    updatePreview("");
    updatePlaceholder("이름과 특징 묘사를 입력하면 이미지 미리보기가 생성됩니다.");
    return;
  }

  const imageData = generateImageCard({
    name,
    relation: relationInput.value.trim(),
    description,
  });
  if (!imageData) {
    updatePlaceholder("브라우저에서 이미지 미리보기를 만들 수 없습니다.");
    return;
  }
  updatePreview(imageData);
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!name || !description) {
    return;
  }

  const entry = {
    id: crypto.randomUUID(),
    name,
    relation: relationInput.value.trim(),
    description,
    notes: notesInput.value.trim(),
    imageData:
      currentPreview ||
      generateImageCard({
        name,
        relation: relationInput.value.trim(),
        description,
      }),
  };

  const entries = [entry, ...loadEntries()];
  saveEntries(entries);
  renderCards(entries);
  resetForm();
});

generateButton.addEventListener("click", handleGenerate);

const schedulePreview = () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(handleGenerate, 300);
};

[nameInput, relationInput, descriptionInput].forEach((input) => {
  input.addEventListener("input", schedulePreview);
});

renderCards(loadEntries());
