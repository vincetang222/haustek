#!/usr/bin/env bash
# =====================================================================
# TÌM VÀ CHẠY BỘ KIỂM
#
# VÌ SAO CÓ FILE NÀY
# Bản trước gõ cứng tên bốn file trong workflow:
#
#     files=(portal/test/upgrade.mjs portal/test/smoke.js \
#            portal/test/flow.js portal/test/edge.js)
#
# Danh sách gõ cứng đúng đúng một lần — lúc gõ. Đội portal dựng lại portal
# thành v2 và gỡ cả bốn file ấy. Đo trên nhánh crm-cau-noi-v2: thư mục
# portal/test có 41 file, workflow chạy 0, in "bỏ qua" rồi XANH. Một PR
# chạy 1/41 bộ kiểm mà báo đạt còn tệ hơn một PR đỏ, vì không ai đi xem lại.
#
# Nên ở đây không có danh sách. Loại của một bộ kiểm suy ra từ chính nội
# dung file, theo hai luật đo được:
#
#   1. Có `module.exports`  → FILE PHỤ TRỢ, không phải bộ kiểm.
#      (font-that.js, vao-cua.js — hai file duy nhất khớp, đã đối chiếu)
#   2. Nhắc tới playwright/chromium → CẦN TRÌNH DUYỆT (và máy chủ tĩnh).
#      Không nhắc → chạy thẳng bằng node, không cần cài gì.
#
# Luật 2 phải bắt cả `require('playwright')` lẫn `await import(m)` trong
# vòng lặp — crm/test/*.mjs dò ba tên gói nên tìm theo tên gói là trượt.
#
# ĐỐI CHIẾU: trên main luật này ra đúng bốn file mà bản gõ cứng liệt kê,
# không thừa không thiếu; trên nhánh v2 ra 17 bộ node + 22 bộ trình duyệt
# + 2 file phụ trợ. Thêm bộ kiểm mới là nó tự được chạy, không ai phải nhớ.
#
# Dùng:  kiem.sh <node|trinh-duyet> [thư mục...]
# =====================================================================
set -uo pipefail

LOAI="${1:-}"
shift || true
THU_MUC=("$@")
[ ${#THU_MUC[@]} -eq 0 ] && THU_MUC=(crm/test portal/test)

case "$LOAI" in
  node|trinh-duyet) ;;
  *) echo "Dùng: kiem.sh <node|trinh-duyet> [thư mục...]" >&2; exit 2 ;;
esac

# --- tìm ---------------------------------------------------------------
shopt -s nullglob
CO_FILE=0          # thư mục test có tồn tại và có file .js/.mjs nào không
BO=()
PHU_TRO=()
LOAI_KHAC=()

for d in "${THU_MUC[@]}"; do
  [ -d "$d" ] || continue
  for f in "$d"/*.js "$d"/*.mjs; do
    CO_FILE=1
    # api-guard chạy ở job cổng rẻ rồi, không chạy lại ở đây.
    [ "$(basename "$f")" = "api-guard.js" ] && continue
    if grep -q 'module\.exports' "$f"; then
      PHU_TRO+=("$f"); continue
    fi
    if grep -qiE 'playwright|chromium' "$f"; then
      that="trinh-duyet"
    else
      that="node"
    fi
    if [ "$that" = "$LOAI" ]; then BO+=("$f"); else LOAI_KHAC+=("$f"); fi
  done
done

# --- nói ra đã bỏ gì, đừng bỏ im ---------------------------------------
echo "Phân loại ${THU_MUC[*]} — đang chạy nhóm: $LOAI"
[ ${#PHU_TRO[@]}   -gt 0 ] && echo "  file phụ trợ (có module.exports, không phải bộ kiểm): ${PHU_TRO[*]}"
[ ${#LOAI_KHAC[@]} -gt 0 ] && echo "  ${#LOAI_KHAC[@]} bộ thuộc nhóm kia, chạy ở job khác"

if [ ${#BO[@]} -eq 0 ]; then
  if [ $CO_FILE -eq 0 ]; then
    echo "Nhánh này không có bộ kiểm nào trong ${THU_MUC[*]} — bỏ qua."
    exit 0
  fi
  # Có file nhưng không file nào thuộc nhóm này: hợp lệ (ví dụ nhánh chỉ
  # có bộ node). Vẫn in rõ để log không im lặng.
  echo "Không bộ nào thuộc nhóm $LOAI trên nhánh này."
  exit 0
fi

echo "Sẽ chạy ${#BO[@]} bộ:"
printf '  %s\n' "${BO[@]}"

# Chỉ liệt kê, không chạy. Để kiểm chính cái luật phân loại này mà không
# phải chờ hết bộ kiểm — thứ đã cứu được lần gõ cứng trước.
[ "${CHI_LIET_KE:-}" = "1" ] && exit 0

# --- chạy --------------------------------------------------------------
# Mỗi bộ một trần thời gian riêng. Không có trần thì một bộ treo nuốt trọn
# timeout-minutes của cả job và log chỉ còn im lặng — không nói được bộ nào
# treo. 300s là gấp ~3 lần bộ chậm nhất đo được (portal/test/smoke.js: 54s
# trên máy 4 nhân). --kill-after cho Playwright 30s đóng trình duyệt tử tế;
# KILL thẳng thì Chromium thành tiến trình mồ côi.
#
# Chạy HẾT rồi mới báo hỏng, không dừng ở bộ đầu: một lượt chạy cho biết cả
# ba chỗ hỏng vẫn hơn ba lượt mỗi lượt một chỗ.
FAILS=0
HONG=()
for f in "${BO[@]}"; do
  echo "::group::$f"
  rc=0
  timeout --kill-after=30 300 node "$f" || rc=$?
  if [ $rc -ne 0 ]; then
    if [ $rc -eq 124 ] || [ $rc -eq 137 ]; then
      echo "::error file=$f::$f TREO — bị cắt sau 300 giây"
    else
      echo "::error file=$f::$f hỏng, mã thoát $rc"
    fi
    FAILS=$((FAILS + 1)); HONG+=("$f")
  fi
  echo "::endgroup::"
done

echo
echo "$((${#BO[@]} - FAILS))/${#BO[@]} bộ đạt"
if [ $FAILS -ne 0 ]; then
  printf 'hỏng: %s\n' "${HONG[@]}"
  exit 1
fi
