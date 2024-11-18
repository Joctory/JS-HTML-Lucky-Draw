var startSeqs = {};
var startNum = 0;

// jQuery FN
$.fn.playSpin = function (options) {
  if (this.length) {
    if ($(this).is(":animated")) return; // Return false if this element is animating
    startSeqs["mainSeq" + ++startNum] = {};
    $(this).attr("data-playslot", startNum);

    var total = this.length;
    var thisSeq = 0;

    // Initialize options
    if (typeof options == "undefined") {
      options = new Object();
    }

    // Pre-define end nums
    var endNums = [];
    if (typeof options.endNum != "undefined") {
      if ($.isArray(options.endNum)) {
        endNums = options.endNum;
      } else {
        endNums = [options.endNum];
      }
    }

    for (var i = 0; i < this.length; i++) {
      if (typeof endNums[i] == "undefined") {
        endNums.push(0);
      }
    }

    startSeqs["mainSeq" + startNum]["totalSpinning"] = total;
    return this.each(function () {
      options.endNum = endNums[thisSeq];
      startSeqs["mainSeq" + startNum]["subSeq" + ++thisSeq] = {};
      startSeqs["mainSeq" + startNum]["subSeq" + thisSeq]["spinning"] = true;
      var track = {
        total: total,
        mainSeq: startNum,
        subSeq: thisSeq,
      };
      new slotMachine(this, options, track);
    });
  }
};

$.fn.stopSpin = function () {
  if (this.length) {
    if (!$(this).is(":animated")) return; // Return false if this element is not animating
    if ($(this)[0].hasAttribute("data-playslot")) {
      $.each(startSeqs["mainSeq" + $(this).attr("data-playslot")], function (index, obj) {
        obj["spinning"] = false;
      });
    }
  }
};

var slotMachine = function (el, options, track) {
  var slot = this;
  slot.$el = $(el);

  slot.defaultOptions = {
    easing: "swing", // String: easing type for final spin
    time: 3000, // Number: total time of spin animation
    loops: 6, // Number: times it will spin during the animation
    manualStop: false, // Boolean: spin until user manually click to stop
    useStopTime: false, // Boolean: use stop time
    stopTime: 5000, // Number: total time of stop aniation
    stopSeq: "random", // String: sequence of slot machine end animation, random, leftToRight, rightToLeft
    endNum: 0, // Number: animation end at which number/ sequence of list
    onEnd: $.noop, // Function: run on each element spin end, it is passed endNum
    onFinish: $.noop, // Function: run on all element spin end, it is passed endNum
  };

  slot.spinSpeed = 0;
  slot.loopCount = 0;

  slot.init = function () {
    slot.options = $.extend({}, slot.defaultOptions, options);
    slot.setup();
    slot.startSpin();
  };

  slot.setup = function () {
    var $li = slot.$el.find("li").first();
    slot.liHeight = $li.innerHeight();
    slot.liCount = slot.$el.children().length;
    slot.listHeight = slot.liHeight * slot.liCount;
    slot.spinSpeed = slot.options.time / slot.options.loops;

    $li.clone().appendTo(slot.$el); // Clone to last row for smooth animation

    // Configure stopSeq
    if (slot.options.stopSeq == "leftToRight") {
      if (track.subSeq != 1) {
        slot.options.manualStop = true;
      }
    } else if (slot.options.stopSeq == "rightToLeft") {
      if (track.total != track.subSeq) {
        slot.options.manualStop = true;
      }
    }
  };

  slot.startSpin = function () {
    slot.$el.css("top", -slot.listHeight).animate({ top: "0px" }, slot.spinSpeed, "linear", function () {
      slot.lowerSpeed();
    });
  };

  slot.lowerSpeed = function () {
    slot.loopCount++;

    if (
      slot.loopCount < slot.options.loops ||
      (slot.options.manualStop && startSeqs["mainSeq" + track.mainSeq]["subSeq" + track.subSeq]["spinning"])
    ) {
      slot.startSpin();
    } else {
      slot.endSpin();
    }
  };

  slot.endSpin = function () {
    if (slot.options.endNum == 0) {
      slot.options.endNum = slot.randomRange(1, slot.liCount);
    }

    // Error handling if endNum is out of range
    if (slot.options.endNum < 0 || slot.options.endNum > slot.liCount) {
      slot.options.endNum = 1;
    }

    var finalPos = -(slot.liHeight * slot.options.endNum - slot.liHeight);
    var finalTime = (slot.spinSpeed * 1.5 * slot.liCount) / slot.options.endNum;
    if (slot.options.useStopTime) {
      finalTime = slot.options.stopTime;
    }

    slot.$el
      .css("top", -slot.listHeight)
      .animate({ top: finalPos }, parseInt(finalTime), slot.options.easing, function () {
        slot.$el.find("li").last().remove(); // Remove the cloned row

        slot.endAnimation(slot.options.endNum);
        if ($.isFunction(slot.options.onEnd)) {
          slot.options.onEnd(slot.options.endNum);
        }

        // onFinish is every element is finished animation
        if (startSeqs["mainSeq" + track.mainSeq]["totalSpinning"] == 0) {
          var totalNum = "";
          $.each(startSeqs["mainSeq" + track.mainSeq], function (index, subSeqs) {
            if (typeof subSeqs == "object") {
              totalNum += subSeqs["endNum"].toString();
            }
          });
          if ($.isFunction(slot.options.onFinish)) {
            slot.options.onFinish(totalNum);
          }
        }
      });
  };

  slot.endAnimation = function (endNum) {
    if (slot.options.stopSeq == "leftToRight" && track.total != track.subSeq) {
      startSeqs["mainSeq" + track.mainSeq]["subSeq" + (track.subSeq + 1)]["spinning"] = false;
    } else if (slot.options.stopSeq == "rightToLeft" && track.subSeq != 1) {
      startSeqs["mainSeq" + track.mainSeq]["subSeq" + (track.subSeq - 1)]["spinning"] = false;
    }
    startSeqs["mainSeq" + track.mainSeq]["totalSpinning"]--;
    startSeqs["mainSeq" + track.mainSeq]["subSeq" + track.subSeq]["endNum"] = endNum;
  };

  slot.randomRange = function (low, high) {
    return Math.floor(Math.random() * (1 + high - low)) + low;
  };

  this.init();
};

// ============================ Others Function ============================ //
// Existing items array with name included
let items = [
  { value: 1, classname: "item-Foldable-Bags", name: "Foldable Bags", probability: 0.35 },
  { value: 2, classname: "item-Whiteboards", name: "Whiteboards", probability: 0.5 },
  { value: 3, classname: "item-Portable-Fans", name: "Portable Fans", probability: 0.15 },
  // { value: 4, classname: "item-TADA-Vouchers", name: "TADA Vouchers", probability: 0.25 },
];

let editIndex = null; // To track the index of the item being edited

// Function to render items in the list
function renderItems() {
  const itemList = $("#item-list");
  itemList.empty();
  items.forEach((item, index) => {
    itemList.append(`
            <li>
              Name: ${item.name}, Probability: ${item.probability} 
              <button class="edit-item" data-index="${index}">Edit</button>
              <button class="remove-item" data-index="${index}">Remove</button>
            </li>
          `);
  });
}

// Add item event
$("#add-item").click(function () {
  const name = $("#item-name").val(); // Get the name from the input
  const probability = parseFloat($("#item-probability").val());
  if (name && !isNaN(probability) && probability >= 0) {
    const newValue = items.length > 0 ? Math.max(...items.map((item) => item.value)) + 1 : 1; // Increment value
    if (editIndex !== null) {
      // Update existing item
      items[editIndex] = {
        value: items[editIndex].value,
        classname: items[editIndex].classname, // Keep the original classname
        name,
        probability,
      }; // Keep the original value
      editIndex = null; // Reset edit index after updating
    } else {
      // Add new item
      items.push({ value: newValue, name, probability });
    }
    renderItems();
    $("#item-name").val(""); // Clear name input field
    $("#item-probability").val(""); // Clear probability input field
  }
});

// Edit item event
$(document).on("click", ".edit-item", function () {
  editIndex = $(this).data("index");
  const item = items[editIndex];
  $("#item-name").val(item.name); // Populate name input field
  $("#item-probability").val(item.probability);
});

// Remove item event
$(document).on("click", ".remove-item", function () {
  const itemName = items[$(this).data("index")].name.replace(/\s+/g, "-"); // Get the item name and format it
  items = items.filter((item) => item.name !== items[$(this).data("index")].name); // Remove item from the array
  renderItems(); // Re-render the item list
  // Remove the corresponding <li> element from the DOM using class
  $(`.item-${itemName}`).remove(); // Remove the <li> element by class
});

// Initial render
renderItems();

// Function to select an item based on normalized probability
function selectItemBasedOnProbability() {
  // Calculate the total probability
  const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);

  // Normalize probabilities if total is not 1
  const normalizedItems = items.map((item) => ({
    ...item,
    probability: item.probability / totalProbability, // Normalize each item's probability
  }));

  const randomValue = Math.random(); // Generate a random value between 0 and 1

  let cumulativeProbability = 0;
  for (const item of normalizedItems) {
    cumulativeProbability += item.probability;
    if (randomValue <= cumulativeProbability) {
      return item; // Return the entire item object
    }
  }

  // Fallback to the last item if no selection is made (shouldn't happen if probabilities sum to 1)
  return normalizedItems[normalizedItems.length - 1];
}

var sound = new Audio("https://cdn.jsdelivr.net/gh/Joctory/Game-O-Matic-Game@main/Lucky%20Draw/ringtones/spinning.mp3");
var ding = new Audio("https://cdn.jsdelivr.net/gh/Joctory/Game-O-Matic-Game@main/Lucky%20Draw/ringtones/new-ding.mp3");
var celebrate = new Audio(
  "https://cdn.jsdelivr.net/gh/Joctory/Game-O-Matic-Game@main/Lucky%20Draw/ringtones/celebrate.mp3"
);

// Loop of playing sound
sound.addEventListener(
  "ended",
  function () {
    this.currentTime = 0;
    this.play();
  },
  false
);

$("#btn-spin").click(function () {
  const selectedItem = selectItemBasedOnProbability(); // Get the entire item object
  const prizeTitle = $("#prize-title");
  const prizeDiv = $(".prize-title-main");

  prizeDiv.html("Spin started! Good Luck!");
  console.log("(" + selectedItem.value + ")" + selectedItem.name); // Log the selected item value

  const firstClassNames = getFirstClassNameFromLists(selectedItem.classname);
  sound.play(); // Start play the sound after click button
  console.log(selectedItem.classname);
  // const randomizedEndNumbers = getRandomizedEndNumbers(selectedItem);

  $("#example2 ul").playSpin({
    endNum: firstClassNames,
    time: 3000,
    stopSeq: "leftToRight",
    onEnd: function () {
      ding.pause();
      ding.currentTime = 0;
      ding.play(); // Play ding after each number is stopped
    },
    onFinish: function () {
      prizeDiv.html("Congratuations on getting <span class='selected'>" + selectedItem.name + "</span>");
      confetti({
        particleCount: 400,
        spread: 250,
        origin: { y: 0.5 },
      });
      sound.pause();
      sound.currentTime = 0;
      celebrate.play();
    },
  });
});

$("#setting-btn").click(function () {
  $(".sm-setting").slideToggle(); // Slide toggle the sm-setting div
});

function scaleSlotMain() {
  const slotMain = document.querySelector(".slot-main");
  const scaleFactor = Math.min(window.innerWidth / 620, window.innerHeight / 200); // Adjust these values as needed
  slotMain.style.transform = `scale(${Math.min(scaleFactor - 0.1, 1)})`; // Cap scale at 1
}

// Call the function on load and resize
window.addEventListener("resize", scaleSlotMain);

// Hide loading indicator when the page is fully loaded
window.addEventListener("load", function () {
  scaleSlotMain();
});

// Function to get the first class name from the specified item
function getFirstClassNameFromLists(itemClassName) {
  // Select all <li> elements from the specified <ul> classes
  const items = $(".machine-left li, .machine-center li, .machine-right li");

  // Filter the items to find the one with the specified class name
  const matchingItems = items.filter(function () {
    return $(this).hasClass(itemClassName);
  });

  // Return the first class name of the matching items
  return matchingItems
    .map(function () {
      const classes = this.className.split(" "); // Split the class names
      return classes[0]; // Return the first class name
    })
    .get(); // Convert jQuery object to array
}
