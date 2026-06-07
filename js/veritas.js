let arrow = document.querySelectorAll(".arrow");
for (var i = 0; i < arrow.length; i++) {
    arrow[i].addEventListener("click", (e)=>{
        let arrowParent = e.target.parentElement.parentElement;//selecting main parent of arrow
        arrowParent.classList.toggle("showMenu");
    });
}
let sidebar = document.querySelector(".sidebar2");
let sidebarBtn = document.querySelector(".bx-menu");
console.log(sidebarBtn);
sidebarBtn.addEventListener("click", ()=>{
    sidebar.classList.toggle("close2");
});

var swiper = new Swiper(".slide-content", {
  slidesPerView: 3,
  spaceBetween: 5,
  loop: true,
  centerSlide: 'true',
  fade: 'true',
  grabCursor: 'true',
  autoplay: {
    delay: 1000,
    disableOnInteraction: false,
  },
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

const dropdownMenu = document.querySelector('.dropdown-menu');
const toggleBtn = document.querySelector('.togglebtn');
const toggleBtnIcon = document.querySelector('.togglebtn i');

toggleBtn.addEventListener("click", function(event) {
  event.stopPropagation(); // Prevent this click from triggering the document click event
  dropdownMenu.classList.toggle('active');
  const isActive = dropdownMenu.classList.contains('active');
  toggleBtnIcon.classList = isActive
    ? 'bx bx-x bx-md'
    : 'bx bx-menu bx-md';
});

document.addEventListener('click', function(event) {
  if (!dropdownMenu.contains(event.target)) {
    // Clicked outside the dropdown menu, hide it
    dropdownMenu.classList.remove('active');
    toggleBtnIcon.className = 'bx bx-menu bx-md';
  }
});

document.getElementById('loginbtn').addEventListener("click", function() {
	var inputs = document.getElementsByTagName('input');
  for(var i = 0; i < inputs.length; i++) {
      if(inputs[i].type.toLowerCase() == 'text' || inputs[i].type.toLowerCase() == 'password') {
          inputs[i].value = '';
      }
  }
  document.querySelector('.modallogin').style.display = "flex";
  document.body.style.overflow = 'hidden';
});

document.getElementById('dmloginbtn').addEventListener("click", function() {
	var inputs = document.getElementsByTagName('input');
  for(var i = 0; i < inputs.length; i++) {
      if(inputs[i].type.toLowerCase() == 'text' || inputs[i].type.toLowerCase() == 'password') {
          inputs[i].value = '';
      }
  }
  document.querySelector('.modallogin').style.display = "flex";
  document.body.style.overflow = 'hidden';
  dropdownMenu.classList.remove('active');
  toggleBtnIcon.className = 'bx bx-menu bx-md';
});

document.getElementById('loginbtn2').addEventListener("click", function() {
  document.querySelector('.modalregister').style.display = "none";
	document.querySelector('.modallogin').style.display = "flex";
});

document.querySelector('.close4login').addEventListener("click", function() {
	document.querySelector('.modallogin').style.display = "none";
  document.body.style.overflow = 'auto';
});

document.getElementById('registerbtn').addEventListener("click", function() {
	var inputs = document.getElementsByTagName('input');
  var selects = document.getElementsByTagName('select');
  for(var i = 0; i < inputs.length; i++) {
      if(inputs[i].type.toLowerCase() == 'text' || inputs[i].type.toLowerCase() == 'password' || inputs[i].type.toLowerCase() == 'email') {
          inputs[i].value = '';
      }
  }
  for(var i = 0; i < selects.length; i++) {
    selects[i].selectedIndex = -1;
  }
  document.querySelector('.modalregister').style.display = "flex";
  document.body.style.overflow = 'hidden';
});

document.getElementById('dmregisterbtn').addEventListener("click", function() {
	var inputs = document.getElementsByTagName('input');
  var selects = document.getElementsByTagName('select');
  for(var i = 0; i < inputs.length; i++) {
      if(inputs[i].type.toLowerCase() == 'text' || inputs[i].type.toLowerCase() == 'password' || inputs[i].type.toLowerCase() == 'email') {
          inputs[i].value = '';
      }
  }
  for(var i = 0; i < selects.length; i++) {
    selects[i].selectedIndex = -1;
  }
  document.querySelector('.modalregister').style.display = "flex";
  document.body.style.overflow = 'hidden';
  dropdownMenu.classList.remove('active');
  toggleBtnIcon.className = 'bx bx-menu bx-md';
});

document.getElementById('registerbtn2').addEventListener("click", function() {
	document.querySelector('.modallogin').style.display = "none";
  document.querySelector('.modalregister').style.display = "flex";
});

document.querySelector('.close4register').addEventListener("click", function() {
	document.querySelector('.modalregister').style.display = "none";
  document.body.style.overflow = 'auto';
});

document.querySelectorAll('.phoneno').addEventListener('input', function (e) {
  e.target.value = e.target.value.replace(/[^\d]/g, '');
});

// document.getElementById('LoginMo').addEventListener('click', function (e) {
//   var loginemailorphone = document.getElementById('loginemailorphone').value;
//   var loginpw = document.getElementById('loginpw').value;

//   fetch('/login', {
//     method: 'post',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ loginemailorphone, loginpw }),
//   })
//   .then(res => res.json())
//   .then(data => {
//     if (data.succes) {
//       var inputs = document.getElementsByTagName('input');
//       for(var i = 0; i < inputs.length; i++) {
//         if(inputs[i].type.toLowerCase() == 'text' || inputs[i].type.toLowerCase() == 'password') {
//           inputs[i].value = '';
//         }
//       }
      
//     } else {
//       alert(data.message);
//     }
//   })
//   .catch((error) => {
//     console.error('Error:', error);
//   });
// });

// document.querySelector('.composebtn').addEventListener("click", function() {
// 	var inputs = document.getElementsByTagName('input');
//   var selects = document.getElementsByTagName('select');
//   for(var i = 0; i < inputs.length; i++) {
//       if(inputs[i].type.toLowerCase() == 'text' || inputs[i].type.toLowerCase() == 'email') {
//           inputs[i].value = '';
//       }
//   }
//   for(var i = 0; i < selects.length; i++) {
//     selects[i].selectedIndex = -1;
//   }
//   document.querySelector('.modal-compose').style.display = "flex";
//   document.body.style.overflow = 'hidden';
// });

// document.querySelector('.close4compose').addEventListener("click", function() {
// 	document.querySelector('.modal-compose').style.display = "none";
//   document.body.style.overflow = 'auto';
// });