var x = document.getElementById("coord");
var myMap
var latitude = localStorage.getItem("currentLatitude")
var longitude = localStorage.getItem("currentLongitude")
var newMarkCoord
var marks = localStorage.getItem("marks") == null ? new Set() : new Set([...(JSON.parse(localStorage.getItem("marks")))])

x.addEventListener('DOMSubtreeModified', contentChanged, false);
getLocation()

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, declined);
  } else {
    x.innerHTML = "Геолокация не поддерживается вашим браузером.";
  }
}

function declined() {
  x.innerHTML = "<br>Вы отклонили запрос геопозиции. Будет показано предыдущее местоположение"
}

function showPosition(position) {
  latitude = position.coords.latitude
  longitude = position.coords.longitude
  x.innerHTML = "<br>Широта: " + latitude +
  "<br>Долгота: " + longitude;
  localStorage.setItem("currentLatitude", latitude)
  localStorage.setItem("currentLongitude", longitude)
}

function contentChanged() {
  ymaps.ready(init)
}

function init() {
    myMap = new ymaps.Map("my-map", {
    center: [latitude,longitude],
    zoom: 15,
    controls: ['routeButtonControl']
  }, {})

  var searchControl = new ymaps.control.SearchControl({
    options: {
      noPopup: false,
      provider: 'yandex#search'
   }
  });
  searchControl.options.set({
    maxWidth: '500px',
    float: 'right'
  });
  myMap.controls.add(searchControl);

  var control = myMap.controls.get('routeButtonControl');
  control.routePanel.state.set({
    type: "masstransit",
    fromEnabled: true,
    from: [latitude,longitude],
    toEnabled: true
  })

  var currentPlacemark = new ymaps.Placemark([latitude,longitude],{}, {
      iconLayout: 'default#image',
      iconImageHref: 'marker.svg',
      iconImageSize: [30,30],
      iconImageOffset: [-15,-27]
  })

  myMap.geoObjects.add(currentPlacemark)


  marks.forEach(function(item) {
    var coords = item.split(",")
    var placemark2 = new ymaps.Placemark([coords[0],coords[1]],{}, {})

    placemark2.events.add('contextmenu', function(e) {
      myMap.geoObjects.remove(placemark2)
      marks.delete(`${coords[0]},${coords[1]}`)
      localStorage.setItem("marks", JSON.stringify(Array.from(marks)))
    })

    myMap.geoObjects.add(placemark2)
  })

  myMap.events.add('click', function (e) {
    newMarkCoord = e.get('coords')
    newMarkLat = newMarkCoord[0].toPrecision(6)
    newMarkLong = newMarkCoord[1].toPrecision(6)
    if (!myMap.balloon.isOpen()) {
        ymaps.geocode([newMarkLat,newMarkLong])
          .then(function(res) {
            markTextLocation = res.geoObjects.get(0).properties.get("text")
            myMap.balloon.open(newMarkCoord, {
              contentBody:`<a>${markTextLocation}</a></br><Button onclick="addMark(${newMarkLat},${newMarkLong})">Добавить метку</Button>`,
          });
        })
    }
    else {
        myMap.balloon.close();
    }
  });
}

function addMark(lat, long) {
  var newPlacemark = new ymaps.Placemark([lat,long],{}, {})
  myMap.geoObjects.add(newPlacemark)
  marks.add(`${lat},${long}`)
  localStorage.setItem("marks", JSON.stringify(Array.from(marks)))
  myMap.balloon.close();

  newPlacemark.events.add('contextmenu', function(e) {
    myMap.geoObjects.remove(newPlacemark)
    marks.delete(`${lat},${long}`)
    localStorage.setItem("marks", JSON.stringify(Array.from(marks)))
  })
}