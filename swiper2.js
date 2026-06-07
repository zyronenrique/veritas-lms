var swiper = new Swiper(".slide-content", {
  slidesPerView: 3,
  spaceBetween: 25,
  loop: true,
  centerSlide: 'true',
  fade: 'true',
  grabCursor: 'true',
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
    dynamicBullets: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints:{
      0: {
          slidesPerView: 1,
      },
      520: {
          slidesPerView: 2,
      },
      950: {
          slidesPerView: 3,
      },
  },
});

  let items = document.querySelectorAll('.item');
  console.log(items);
  items.forEach(item => {
      item.addEventListener('mousemove', (e)=>{
          let positionPx = e.x - item.getBoundingClientRect().left;
          let positionX = (positionPx / item.offsetWidth) * 100;
          console.log(positionX, positionPx);
  
          let positionPy = event.y - item.getBoundingClientRect().top;
          let positionY = (positionPy / item.offsetHeight) * 100;
  
          
          item.style.setProperty('--rX', (0.5)*(50 - positionY) + 'deg');
          item.style.setProperty('--rY', -(0.5)*(50 - positionX) + 'deg');
      })
      item.addEventListener('mouseout', ()=>{
          item.style.setProperty('--rX', '0deg');
          item.style.setProperty('--rY', '0deg');
      })
  })