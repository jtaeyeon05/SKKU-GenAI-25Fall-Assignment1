// 기본 JavaScript 파일
document.addEventListener('DOMContentLoaded', function() {
    console.log('웹페이지가 로드되었습니다.');
    
    // 간단한 환영 메시지
    const welcomeMessage = '빈 웹페이지에 오신 것을 환영합니다!';
    console.log(welcomeMessage);
    
    // 페이지 로드 시간 표시
    const loadTime = new Date().toLocaleString('ko-KR');
    console.log('페이지 로드 시간:', loadTime);
    
    // 헤더 클릭 이벤트 (선택사항)
    const header = document.querySelector('header h1');
    if (header) {
        header.addEventListener('click', function() {
            alert('헤더를 클릭하셨습니다!');
        });
        
        // 호버 효과를 위한 스타일 추가
        header.style.cursor = 'pointer';
        header.style.transition = 'color 0.3s ease';
        
        header.addEventListener('mouseenter', function() {
            this.style.color = '#3498db';
        });
        
        header.addEventListener('mouseleave', function() {
            this.style.color = '#2c3e50';
        });
    }
});
