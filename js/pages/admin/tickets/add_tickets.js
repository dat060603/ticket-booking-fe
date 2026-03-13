import CONFIG from "../../../utils/settings.js";
const BASE_URL = CONFIG.BASE_URL;

let allMatches = {
  missing: [],
  completed: [],
};

document.addEventListener("DOMContentLoaded", () => {
  fetchMatchesWithoutTickets();

  document.getElementById("matchTypeFilter").addEventListener("change", () => {
    filterAndRender();
  });

  document.getElementById("matchSearchInput").addEventListener("input", () => {
    filterAndRender();
  });
});

function fetchMatchesWithoutTickets() {
  fetch(`${BASE_URL}/api/tickets/matches/without-tickets/`)
    .then(response => response.json())
    .then(data => {
      allMatches.missing = data.matches_with_missing_prices || [];
      allMatches.completed = data.completed_matches || [];
      filterAndRender(); // render lần đầu
    })
    .catch(error => {
      console.error("Lỗi khi lấy danh sách trận:", error);
      Swal.fire("Lỗi", "Không thể tải danh sách trận đấu", "error");
    });
}

function filterAndRender() {
  const filterType = document.getElementById("matchTypeFilter").value;
  const keyword = document.getElementById("matchSearchInput").value.toLowerCase();

  let matches = [];

  if (filterType === "missing") {
    matches = allMatches.missing;
  } else if (filterType === "completed") {
    matches = allMatches.completed;
  } else {
    matches = [...allMatches.missing, ...allMatches.completed];
  }

  // Lọc theo từ khóa
  if (keyword) {
    matches = matches.filter(match =>
      `${match.description} ${match.team_1_name} ${match.team_2_name} ${match.stadium_name} ${match.league_name}`
        .toLowerCase()
        .includes(keyword)
    );
  }

  renderMatchesTable(matches);
}

function renderMatchesTable(matches) {
  const tbody = document.querySelector("#matchesTable tbody");
  tbody.innerHTML = "";

  matches.forEach((match, index) => {
    const matchTime = new Date(match.match_time);
    const isPast = matchTime < new Date();
    const isCompleted = allMatches.completed.find(m => m.match_id === match.match_id);

    const actionButton = isCompleted
      ? `<button class="btn btn-sm btn-secondary" onclick="loadMatchDetailPage(${match.match_id}, 'completed')">Trận đấu đã kết thúc</button>`
      : `<button class="btn btn-sm btn-outline-warning" onclick="loadMatchDetailPage(${match.match_id}, 'missing')"><i class="bi bi-ticket-detailed"></i> Tạo vé</button>`;

    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${match.description}</td>
        <td>${match.round}</td>
        <td>${match.team_1_name}</td>
        <td>${match.team_2_name}</td>
        <td>${match.stadium_name}</td>
        <td>${match.league_name}</td>
        <td>${matchTime.toLocaleString()}</td>
        <td>${actionButton}</td>
      </tr>
    `;

    tbody.insertAdjacentHTML("beforeend", row);
  });
}
// search mo ta 
document.getElementById("matchSearchInput").addEventListener("input", function () {
  const keyword = this.value.toLowerCase().trim();
  const rows = document.querySelectorAll("#matchesTable tbody tr");

  rows.forEach(row => {
    const cells = row.children;

    const description = cells[1]?.textContent.toLowerCase();
    const team1 = cells[2]?.textContent.toLowerCase();
    const team2 = cells[3]?.textContent.toLowerCase();
    const stadium = cells[4]?.textContent.toLowerCase();
    const league = cells[5]?.textContent.toLowerCase();

    const matchText = `${description} ${team1} ${team2} ${stadium} ${league}`;

    if (matchText.includes(keyword)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
});
//loc ngày
function filterMatchesByDate() {
  const startDateInput = document.getElementById("startDate").value;
  const endDateInput = document.getElementById("endDate").value;
  const rows = document.querySelectorAll("#matchesTable tbody tr");

  const startDate = startDateInput ? new Date(startDateInput) : null;
  const endDate = endDateInput ? new Date(endDateInput) : null;

  rows.forEach(row => {
    const matchTimeText = row.children[7]?.textContent?.trim(); // Cột "Thời gian đấu"
    const matchTime = new Date(matchTimeText);

    let showRow = true;

    if (startDate && matchTime < startDate) {
      showRow = false;
    }

    if (endDate) {
      // Cộng thêm 1 ngày để tính cả ngày endDate
      const adjustedEnd = new Date(endDate);
      adjustedEnd.setDate(adjustedEnd.getDate() + 1);

      if (matchTime >= adjustedEnd) {
        showRow = false;
      }
    }

    row.style.display = showRow ? "" : "none";
  });
}

// Gắn sự kiện khi người dùng chọn ngày
document.getElementById("startDate").addEventListener("change", filterMatchesByDate);
document.getElementById("endDate").addEventListener("change", filterMatchesByDate);


// 
function getLocalDatetimeString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}



window.loadMatchDetailPage = function(matchId) {
  // Ẩn bảng danh sách, hiện loading
  document.getElementById("matches-list-container").style.display = "none";
  const content = document.getElementById('content-container');
  content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Đang tải thông tin trận đấu...</p></div>';

  fetch(`${BASE_URL}/api/tickets/match-detail/${matchId}/`)
    .then(response => response.json())
    .then(data => {
      const now = new Date();
      const matchTime = new Date(data.match_time);
      window.matchTime = matchTime;
      window.currentMatchId = matchId;

      const timeStr = matchTime.toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' });

      // Render Layout Chính
      content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <button class="btn btn-outline-secondary border-0 ps-0" onclick="backToMatchList()">
                <i class="bi bi-arrow-left"></i> Quay lại danh sách
            </button>
            <h4 class="fw-bold text-primary mb-0">Quản Lý Vé Trận Đấu</h4>
        </div>

        <div class="card border-0 shadow-sm mb-4 bg-white rounded-3 overflow-hidden">
            <div class="card-body p-4">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge bg-${matchTime < now ? 'secondary' : 'success'} me-2">
                                ${matchTime < now ? 'Đã kết thúc' : 'Sắp diễn ra'}
                            </span>
                            <h5 class="card-title fw-bold mb-0 text-dark">${data.stadium_name}</h5>
                        </div>
                        <h3 class="fw-bold text-primary mb-1">${data.description || 'Chi tiết trận đấu'}</h3>
                        <p class="text-muted mb-0"><i class="bi bi-clock-history me-1"></i> ${timeStr}</p>
                    </div>
                    <div class="col-md-4 text-md-end mt-3 mt-md-0">
                        ${matchTime >= now ? `
                            <button class="btn btn-warning text-dark fw-bold px-4 py-2 shadow-sm" onclick="openAiPriceSuggestion(${data.match_id})">
                                <i class="bi bi-stars"></i> AI Gợi ý Giá Tối ưu
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="card shadow-sm border-0">
            <div class="card-header bg-white py-3">
                <h6 class="mb-0 fw-bold"><i class="bi bi-grid-3x3-gap me-2"></i>Danh sách Khu vực & Giá vé</h6>
            </div>
            <div class="card-body p-0">
                <form id="ticket-form">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light text-secondary small text-uppercase">
                                <tr>
                                    <th class="ps-4">Khu vực</th>
                                    <th class="text-center">Số ghế còn lại</th>
                                    <th class="text-end" style="width: 200px;">Giá vé (VNĐ)</th>
                                    <th class="text-center" style="width: 220px;">Ngày mở bán</th>
                                    <th class="text-center">Trạng thái</th>
                                    ${matchTime >= now ? '<th class="text-end pe-4">Thao tác</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.sections.map(section => renderSectionRow(section, matchTime, now, data.match_id)).join('')}
                            </tbody>
                        </table>
                    </div>
                </form>
            </div>
        </div>
      `;
    })
    .catch(error => {
      console.error('Lỗi:', error);
      Swal.fire('Lỗi', 'Không thể tải dữ liệu.', 'error');
    });
}

// --- 2. HÀM RENDER DÒNG BẢNG (HELPER) ---
function renderSectionRow(section, matchTime, now, matchId) {
    const hasPrice = section.has_price;
    const priceDisplay = hasPrice ? parseFloat(section.price).toLocaleString('vi-VN') : '';
    const sellDateVal = hasPrice ? getLocalDatetimeString(new Date(section.sell_date)) : '';
    
    // Logic nút bấm
    let actionBtn = '';
    if (!hasPrice) {
        actionBtn = section.available_seats === 0 
            ? `<button class="btn btn-sm btn-light text-muted" disabled>Hết chỗ</button>`
            : `<button id="btn-create-${section.section_id}" class="btn btn-sm btn-outline-primary" onclick="createTicket(${matchId}, ${section.section_id}, event)">
                 <i class="bi bi-plus-lg"></i> Tạo vé
               </button>`;
    } else {
        if (!section.is_closed && matchTime > now) {
            actionBtn = `<button class="btn btn-sm btn-outline-warning" onclick="event.preventDefault();redirectToEdit(${section.pricing_id})"><i class="bi bi-pencil"></i> Sửa</button>`;
        } else if (new Date(section.sell_date) > now) {
             actionBtn = `
                <button class="btn btn-sm btn-light text-primary" onclick="showUpdateTicketForm(${section.pricing_id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-light text-danger" onclick="event.preventDefault(); deleteTicket(${section.pricing_id})"><i class="bi bi-trash"></i></button>
             `;
        } else {
            actionBtn = `<span class="badge bg-light text-secondary">Đã chốt</span>`;
        }
    }

    return `
        <tr>
            <td class="ps-4 fw-medium">${section.section_name}</td>
            
            <td class="text-center">
                <span class="badge bg-info bg-opacity-10 text-info" style="font-size: 0.9em;">
                    ${section.available_seats} ghế
                </span>
                <input type="hidden" id="available-seats-${section.section_id}" value="${section.available_seats}">
            </td>

            <td class="text-end">
                <input type="text" id="price-${section.section_id}" 
                    class="form-control form-control-sm text-end fw-bold ${hasPrice ? 'bg-light border-0' : ''}" 
                    value="${priceDisplay}" placeholder="0"
                    ${hasPrice || matchTime < now ? 'readonly' : ''} 
                    oninput="formatCurrencyInput(this)">
            </td>

            <td class="text-center">
                <input type="datetime-local" id="sell-${section.section_id}" 
                    class="form-control form-control-sm ${hasPrice ? 'bg-light border-0' : ''}" 
                    value="${sellDateVal}" ${hasPrice || matchTime < now ? 'readonly' : ''}>
            </td>

            <td class="text-center">
                ${hasPrice ? '<span class="text-success small"><i class="bi bi-check-circle-fill"></i> Đã tạo</span>' : '<span class="text-muted small">Chưa tạo</span>'}
            </td>
            
            ${matchTime >= now ? `<td class="text-end pe-4">${actionBtn}</td>` : ''}
        </tr>
    `;
}



// 
function createTicket(matchId, sectionId, event) {
  console.log("matchId:", matchId, "sectionId:", sectionId);
  event.preventDefault();

  const priceInput = document.getElementById(`price-${sectionId}`);
  const sellDateInput = document.getElementById(`sell-${sectionId}`);
  const availableSeatsInput = document.getElementById(`available-seats-${sectionId}`);
  const button = document.getElementById(`btn-create-${sectionId}`);

  if (!priceInput || !sellDateInput || !availableSeatsInput || !button) {
    console.error('Một hoặc nhiều phần tử không tồn tại trong DOM.');
    Swal.fire('Lỗi', 'Không thể tìm thấy các phần tử cần thiết để tạo vé.', 'error');
    return;
  }

  const price = priceInput.value;
  const sellDateStr = sellDateInput.value;
  const availableSeats = parseInt(availableSeatsInput.value);

  if (!price || !sellDateStr || isNaN(availableSeats)) {
    Swal.fire('Lỗi', 'Vui lòng nhập đầy đủ thông tin', 'error');
    return;
  }

  if (isNaN(price) || parseFloat(price) <= 0) {
    Swal.fire('Lỗi', 'Vui lòng nhập giá vé hợp lệ', 'error');
    return;
  }

  const priceValue = parseFloat(price);

  if (priceValue < 50000 || priceValue > 10000000) {
    Swal.fire('Lỗi', 'Giá vé phải nằm trong khoảng từ 50,000 đến 10,000,000 đ', 'error');
    return;
  }

  if (availableSeats <= 0) {
    Swal.fire('Lỗi', 'Khu vực này không còn ghế khả dụng để tạo vé', 'error');
    return;
  }

  const sellDate = new Date(sellDateStr);
  const now = new Date();

  if (sellDate < now) {
    Swal.fire('Lỗi', 'Ngày giờ bắt đầu bán vé không được ở trong quá khứ', 'error');
    return;
  }

  const requestData = {
    price: priceValue,
    sell_date: sellDateStr,
    available_seats: availableSeats
  };

  fetch(`${BASE_URL}/api/tickets/match/${matchId}/section/${sectionId}/price/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  })
  .then(async response => {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Không thể parse JSON từ server:', e);
      throw new Error('Phản hồi không hợp lệ từ server');
    }

    if (!response.ok) {
      const errorMsg = data?.message || 'Đã xảy ra lỗi khi tạo vé';
      throw new Error(errorMsg);
    }

    Swal.fire('Thành công', 'Vé đã được tạo cho khu vực này!', 'success');

    // Cập nhật lại giao diện
    priceInput.value = `${priceValue.toLocaleString('vi-VN')} đ`;
    priceInput.readOnly = true;
    priceInput.classList.add('bg-light');

    sellDateInput.value = getLocalDatetimeString(sellDate);
    sellDateInput.disabled = true;
    sellDateInput.classList.add('bg-light');

    if (button) {
      button.outerHTML = `
        <button class="btn btn-sm btn-primary" disabled>
          <i class="bi bi-check-circle"></i> Đã tạo vé
        </button>`;
    }
  })
  .catch(error => {
    console.error('Lỗi khi tạo vé:', error);
    Swal.fire('Lỗi', error.message || 'Không thể tạo vé', 'error');
  });
}



function redirectToEdit(pricingId) {
    
  console.log(pricingId);
  window.location.href = `/pages/admin/tickets/edit_ticketPrice.html?pricing_id=${pricingId}`;
  console.log(window.location.href);
}
function showUpdateTicketForm(pricingId) {
  event.preventDefault();

  console.log(pricingId);
  fetch(`${BASE_URL}/api/tickets/section-prices/${pricingId}/`)
    .then(res => res.json())
    .then(ticket => {
      const now = new Date();
      const matchTime = new Date(ticket.match_time);

      const toDatetimeLocal = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
      };

      Swal.fire({
        title: 'Cập nhật vé',
        html: `
          <div class="form-group text-start mb-2">
            <label>Tên trận:</label>
            <input type="text" class="form-control" value="${ticket.match_description}" readonly>
          </div>
          <div class="form-group text-start mb-2">
            <label>Tên khu vực:</label>
            <input type="text" class="form-control" value="${ticket.section_name}" readonly>
          </div>
          <div class="form-group text-start mb-2">
            <label>Số ghế khả dụng:</label>
            <input type="number" class="form-control" value="${ticket.available_seats}" readonly>
          </div>
          <div class="form-group text-start mb-2">
            <label>Giá vé:</label>
            <input type="number" id="edit-price" class="form-control" value="${ticket.price}">
          </div>
          <div class="form-group text-start">
            <label>Ngày bán:</label>
            <input 
              type="datetime-local" 
              id="edit-sell-date" 
              class="form-control" 
              value="${ticket.sell_date}" 
              min="${toDatetimeLocal(now)}" 
              max="${toDatetimeLocal(matchTime)}">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Cập nhật',
        cancelButtonText: 'Hủy',
        preConfirm: () => {
          const price = parseInt(document.getElementById('edit-price').value);
          const sellDateInput = document.getElementById('edit-sell-date').value;
          const sellDate = new Date(sellDateInput);

          // Kiểm tra giá trị tiền: phải là số nguyên và nằm trong khoảng từ 50.000 đến 10.000.000
          if (isNaN(price) || !Number.isInteger(price) || price < 50000 || price > 10000000) {
            Swal.showValidationMessage('Giá vé phải là số nguyên trong khoảng từ 50,000 đến 10,000,000 đ.');
            return false;
          }

          if (isNaN(sellDate.getTime())) {
            Swal.showValidationMessage('Vui lòng nhập ngày bán hợp lệ.');
            return false;
          }
          if (sellDate <= now) {
            Swal.showValidationMessage('Ngày bán phải lớn hơn thời điểm hiện tại.');
            return false;
          }
          if (sellDate >= matchTime) {
            Swal.showValidationMessage('Ngày bán phải nhỏ hơn thời gian trận đấu.');
            return false;
          }

          return fetch(`${BASE_URL}/api/tickets/section-prices/${pricingId}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price, sell_date: sellDateInput })
          })
          .then(res => {
            if (!res.ok) throw new Error("Cập nhật không thành công");
            return res.json();
          })
          .catch(err => Swal.showValidationMessage(`Lỗi: ${err.message}`));
        }
      }).then(result => {
        if (result.isConfirmed) {
          Swal.fire('Thành công', 'Cập nhật vé thành công', 'success').then(() => {
            loadTicketPage(new Event('click'));
          });
        }
      });
    })
    .catch(err => {
      console.error("Lỗi tải dữ liệu vé:", err);
      Swal.fire('Lỗi', 'Không thể tải thông tin vé', 'error');
    });
}
function backToTicketsList() {
   if (localStorage.getItem("role") ===  "admin") {
    window.location.href = "/pages/admin/base.html#tickets/tickets";
  }
  else if (localStorage.getItem("role") ===  "staff") {
    window.location.href = "/pages/staff/base.html#tickets/tickets";
  }


}
function backToMatchList() {
  const contentContainer = document.getElementById("content-container");
  const matchListContainer = document.getElementById("matches-list-container");

  // Xóa nội dung chi tiết nhưng KHÔNG ẩn container
  contentContainer.innerHTML = "";

  // Hiện lại danh sách trận
  matchListContainer.style.display = "block";

  // Gọi lại render bảng nếu dữ liệu còn
  if (allMatches && allMatches.completed && allMatches.missing) {
    const all = [...allMatches.completed, ...allMatches.missing];
    renderMatchesTable(all);
  } else {
    console.error("Dữ liệu allMatches không tồn tại hoặc bị lỗi.");
  }
}




const backBtn = document.getElementById("backBtn");
backBtn.addEventListener("click", (e) => {
  e.preventDefault();
  backToTicketsList();
});

function deleteTicket(pricingId) {
  Swal.fire({
    title: 'Xác nhận xóa?',
    text: "Hành động này sẽ không thể hoàn tác!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonText: 'Hủy',
    confirmButtonText: 'Xóa'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${BASE_URL}/api/tickets/section-prices/${pricingId}/`, {
        method: 'DELETE'
      })
      .then(res => {
        if (!res.ok) throw new Error('Xóa thất bại');
        Swal.fire('Đã xóa!', 'Vé đã được xóa thành công.', 'success').then(() => {
          loadMatchDetailPage(window.currentMatchId);

        });
      })
      .catch(err => {
        Swal.fire('Lỗi', 'Không thể xóa vé', 'error');
      });
    }
  });
}
// AI gợi ý giá
// 1. Hàm mở Popup AI
window.openAiPriceSuggestion = function(matchId) {
    // Hiển thị loading
    Swal.fire({
        title: 'AI đang tính toán...',
        text: 'Đang phân tích sức mạnh đội bóng, lịch sử đấu và sức chứa sân...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading() }
    });

    // Gọi API Suggest Price
    fetch(`${BASE_URL}/api/tickets/suggest-price/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer ...' // Nếu có token
        },
        body: JSON.stringify({ match_id: matchId })
    })
    .then(res => res.json())
    .then(data => {
        Swal.close();
        if (data.status === 'success') {
            showAiResultModal(data);
        } else {
            Swal.fire('Lỗi', data.error || 'Không thể lấy dữ liệu AI', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire('Lỗi', 'Lỗi kết nối đến Server', 'error');
    });
}

// 2. Hàm hiển thị Modal Kết quả
// 2. Hàm hiển thị Modal Kết quả
function showAiResultModal(data) {
    const rec = data.recommendation;
    const info = data.match_info;
    const chartData = data.chart_data;
    
    // Lấy dữ liệu độ tin cậy
    const reliability = rec.ai_reliability || { score: 0, level: 'Không rõ', message: 'Chưa có dữ liệu.' };

    const fmtMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    // --- LOGIC MÀU SẮC THEO YÊU CẦU (>75%, 50%) ---
    let relBadgeClass = 'bg-secondary';
    let relIcon = 'bi-question-circle';
    let relTextColor = 'text-muted'; // Biến màu chữ cho dòng text bên dưới

    if (reliability.score >= 75) {
        // CAO (> 75%) -> MÀU XANH
        relBadgeClass = 'bg-success';          
        relIcon = 'bi-check-circle-fill';  
        relTextColor = 'text-success';    
    } else if (reliability.score >= 50) {
        // TRUNG BÌNH (50% - 75%) -> MÀU VÀNG
        relBadgeClass = 'bg-warning text-dark'; 
        relIcon = 'bi-exclamation-triangle-fill'; 
        relTextColor = 'text-warning'; // Hoặc text-dark nếu nền trắng
    } else {
        // THẤP (< 50%) -> MÀU ĐỎ
        relBadgeClass = 'bg-danger';           
        relIcon = 'bi-x-octagon-fill';   
        relTextColor = 'text-danger';      
    }

    const htmlContent = `
        <div class="row text-start">
            <div class="col-md-5">
                <div class="alert alert-light border mb-3">
                    <h6 class="mb-2 text-uppercase text-muted" style="font-size: 0.8rem;">Thông tin trận đấu</h6>
                    <ul class="mb-0 ps-3 small">
                        <li>Trận: <b>${info.name}</b></li>
                       <li>Độ quan trọng: <b>${info.importance}/5</b></li>
                        <li>Độ HOT: ${info.is_hot ? '<span class="badge bg-danger">HOT 🔥</span>' : '<span class="badge bg-secondary">Thường</span>'}</li>
                        <li>Sức chứa: <b>${info.stadium_capacity}</b> ghế</li>
                    </ul>
                </div>
                
                <div class="card border-success mb-3 shadow-sm">
                    <div class="card-header bg-success text-white text-center py-2">
                        <h6 class="mb-0"><i class="bi bi-robot"></i> AI ĐỀ XUẤT</h6>
                    </div>
                    <div class="card-body text-center p-3">
                        <h2 class="fw-bold text-success mb-0">${fmtMoney(rec.optimal_avg_price)}</h2>
                        <p class="small text-muted mb-3">Giá tối ưu dự kiến</p>

                        <div class="border-top pt-3">
                            <span class="badge rounded-pill ${relBadgeClass} mb-2" style="font-size: 1rem; padding: 10px 15px;">
                                <i class="bi ${relIcon}"></i> Độ tin cậy: ${reliability.score}%
                            </span>
                            
                            <div class="fw-bold ${reliability.score >= 50 && reliability.score < 75 ? 'text-dark' : relTextColor}" style="font-size: 0.9rem;">
                                (${reliability.level})
                            </div>

                            <div class="small fst-italic mt-1 text-muted" style="font-size: 0.8rem;">
                                "${reliability.message}"
                            </div>
                        </div>

                    </div>
                </div>

                <ul class="list-group list-group-flush small border rounded">
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Dự báo bán:</span>
                        <strong>${rec.estimated_sold} vé (${rec.fill_rate}%)</strong>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Doanh thu:</span>
                        <strong class="text-success">${fmtMoney(rec.estimated_revenue)}</strong>
                    </li>
                </ul>
            </div>

            <div class="col-md-7">
                <div class="card h-100 border-0">
                    <div class="card-body">
                        <h6 class="text-center text-secondary mb-3">Biểu đồ Phân tích</h6>
                        <canvas id="aiPriceChart" height="300"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    Swal.fire({
        title: '🤖 Phân tích & Định giá AI',
        html: htmlContent,
        width: '950px',
        showCancelButton: true,
        confirmButtonText: 'Áp dụng',
        cancelButtonText: 'Đóng',
        confirmButtonColor: '#198754',
        didOpen: () => {
            renderAiChart(chartData);
        }
    }).then((result) => {
        if (result.isConfirmed) {
            applyPriceToInputs(rec.optimal_avg_price);
        }
    });
}

// 3. Hàm vẽ biểu đồ (Chart.js)
function renderAiChart(chartData) {
    const ctx = document.getElementById('aiPriceChart').getContext('2d');
    
    const labels = chartData.map(d => (d.price / 1000) + 'k'); // 100000 -> 100k
    const revenueData = chartData.map(d => d.revenue);
    const fillData = chartData.map(d => d.fill_rate);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh thu (VNĐ)',
                    data: revenueData,
                    backgroundColor: 'rgba(25, 135, 84, 0.6)', // Màu xanh
                    yAxisID: 'y',
                    order: 2
                },
                {
                    label: 'Tỷ lệ lấp đầy (%)',
                    data: fillData,
                    type: 'line',
                    borderColor: 'rgba(220, 53, 69, 1)', // Màu đỏ
                    borderWidth: 2,
                    pointRadius: 0,
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    display: false, // Ẩn trục số tiền cho đỡ rối
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    grid: { drawOnChartArea: false }
                }
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.dataset.yAxisID === 'y') {
                                label += new Intl.NumberFormat('vi-VN').format(context.raw) + ' đ';
                            } else {
                                label += context.raw + '%';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// 4. Hàm áp dụng giá vào Form
function applyPriceToInputs(avgPrice) {
    const inputs = document.querySelectorAll('input[id^="price-"]');
    let count = 0;

    inputs.forEach(input => {
        if (input.readOnly) return; // Bỏ qua ô đã khóa

        const row = input.closest('tr');
        
        // --- SỬA Ở ĐÂY: Index là 0 (Cột đầu tiên) ---
        // Thêm toUpperCase() để so sánh không phân biệt hoa thường
        const sectionName = row.cells[0].textContent.trim().toUpperCase(); 

        let finalPrice = avgPrice;

        // Logic định giá (Bạn có thể chỉnh hệ số tùy ý)
        if (sectionName.includes('VIP')) {
            finalPrice = avgPrice * 2.0;  // VIP đắt gấp đôi
        } else if (sectionName.includes('STAND A') || sectionName.includes('KHÁN ĐÀI A')) {
            finalPrice = avgPrice * 1.5;  // Khán đài A đắt hơn chút
        } else if (sectionName.includes('STAND B') || sectionName.includes('KHÁN ĐÀI B')) {
            finalPrice = avgPrice * 1.2;
        } else if (sectionName.includes('C') || sectionName.includes('D')) {
            finalPrice = avgPrice * 0.8;  // Khán đài góc rẻ hơn
        }

        // Làm tròn đến hàng nghìn
        finalPrice = Math.round(finalPrice / 1000) * 1000;

        // Gán giá trị và FORMAT lại (thêm dấu chấm) để hiển thị đẹp
        input.value = finalPrice;
        
        count++;
    });

    if (count > 0) {
        Swal.fire({
            icon: 'success',
            title: 'Đã áp dụng',
            text: `Đã tự động phân bổ giá vé cho ${count} khu vực!`,
            timer: 1500,
            showConfirmButton: false
        });
    }
}

// 5. Helper text
function getReasonText(code) {
    const map = {
        "OPTIMAL_FILL": "Mức giá này giúp Lấp đầy sân tối đa (Cháy vé).",
        "BALANCED": "Điểm cân bằng hoàn hảo giữa Doanh thu và Lượng khách.",
        "PROFIT_MAX": "Tối ưu hóa Lợi nhuận cho trận HOT (chấp nhận một số ghế trống).",
        "SAFE_OPTION": "Mức giá an toàn nhất để tránh lỗ vốn."
    };
    return map[code] || code;
}
// 
window.deleteTicket = deleteTicket; 
window.backToMatchList= backToMatchList; // Để có thể gọi từ HTML
window.backToTicketsList = backToTicketsList; // Để có thể gọi từ HTML
window.showUpdateTicketForm = showUpdateTicketForm; // Để có thể gọi từ HTML
window.redirectToEdit= redirectToEdit; // Để có thể gọi từ bên ngoài
// 
window.loadMatchDetailPage = loadMatchDetailPage; // Để có thể gọi từ bên ngoài
window.createTicket = createTicket; // Để có thể gọi từ bên ngoài 

