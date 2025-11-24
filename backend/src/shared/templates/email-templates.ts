// Email templates for the system
export const emailTemplates = {
  /**
   * Template cho email gửi admin khi có đăng ký giáo viên mới
   */
  teacherRegistrationAdmin: (data: {
    fullName: string;
    email: string;
    phone: string;
    scoreOrCert: string;
    experience: string;
    availability: string;
    message?: string;
  }) => {
    const rows = [
      { label: "Họ và tên", value: data.fullName },
      { label: "Email", value: data.email },
      { label: "Số điện thoại", value: data.phone },
      { label: "Điểm TOEIC / Chứng chỉ", value: data.scoreOrCert || "Không có" },
      { label: "Kinh nghiệm giảng dạy", value: data.experience },
      { label: "Thời gian có thể dạy", value: data.availability },
      ...(data.message ? [{ label: "Ghi chú thêm", value: data.message }] : []),
    ];

    const tableRows = rows
      .map(
        (row) => `
        <tr>
          <td style="padding: 12px 16px; font-weight: 600; background: #f8f9fa; border: 1px solid #e9ecef; color: #212529; width: 180px;">${row.label}</td>
          <td style="padding: 12px 16px; border: 1px solid #e9ecef; color: #495057;">${row.value || "<i>Không có</i>"}</td>
        </tr>`
      )
      .join("");

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đăng ký giáo viên mới</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🎓 Đăng ký giáo viên mới</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; color: #495057; font-size: 16px; line-height: 1.6;">
                Chào Admin,
              </p>
              <p style="margin: 0 0 24px; color: #495057; font-size: 16px; line-height: 1.6;">
                Có một ứng viên mới vừa gửi đơn đăng ký trở thành giáo viên trên nền tảng <strong>TOEIC Practice</strong>. Vui lòng xem xét thông tin dưới đây:
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
                ${tableRows}
              </table>
              
              <div style="margin-top: 32px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>📌 Lưu ý:</strong> Email này được gửi tự động từ hệ thống. Vui lòng liên hệ trực tiếp với ứng viên qua email <strong>${data.email}</strong> hoặc số điện thoại <strong>${data.phone}</strong> để xác nhận và cấp quyền giáo viên nếu hồ sơ phù hợp.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.6;">
                © ${new Date().getFullYear()} TOEIC Practice. Email tự động từ hệ thống.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  },

  /**
   * Template cho email tự động phản hồi user khi đăng ký giáo viên thành công
   */
  teacherRegistrationUser: (data: {
    fullName: string;
    email: string;
  }) => {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đăng ký giáo viên thành công</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">✅ Đăng ký thành công!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
                Chào <strong>${data.fullName}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #495057; font-size: 16px; line-height: 1.6;">
                Cảm ơn bạn đã quan tâm và đăng ký trở thành giáo viên trên nền tảng <strong>TOEIC Practice</strong>! 🎉
              </p>
              
              <div style="margin: 24px 0; padding: 20px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
                <p style="margin: 0 0 12px; color: #0d47a1; font-size: 15px; font-weight: 600;">
                  📋 Bước tiếp theo:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #1565c0; font-size: 14px; line-height: 1.8;">
                  <li>Chúng tôi đã nhận được thông tin đăng ký của bạn</li>
                  <li>Admin sẽ xem xét hồ sơ của bạn trong thời gian sớm nhất</li>
                  <li>Nếu hồ sơ phù hợp, chúng tôi sẽ liên hệ với bạn qua email <strong>${data.email}</strong> hoặc số điện thoại bạn đã cung cấp</li>
                  <li>Thời gian phản hồi thường từ 1-3 ngày làm việc</li>
                </ul>
              </div>
              
              <p style="margin: 24px 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
                Trong thời gian chờ đợi, bạn có thể tiếp tục sử dụng các tính năng miễn phí của nền tảng. Nếu có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.
              </p>
              
              <p style="margin: 24px 0 0; color: #495057; font-size: 16px; line-height: 1.6;">
                Chúc bạn một ngày tốt lành!<br>
                <strong>Đội ngũ TOEIC Practice</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.6;">
                © ${new Date().getFullYear()} TOEIC Practice. Email tự động từ hệ thống.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  },
};

