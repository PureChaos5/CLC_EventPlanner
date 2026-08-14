function doGet() {
  return HtmlService.createHtmlOutputFromFile('EventPlanningIndex')
      .setTitle('RA Event Backward Planner')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Creates all selected calendar events with guest invitations and modify permissions.
 * Returns both a success message and a clean text summary for copy-pasting.
 */
function processMilestones(data) {
  var calendar = CalendarApp.getDefaultCalendar();
  var eventDate = new Date(data.eventDate + "T00:00:00");
  
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var cohostList = data.cohosts ? data.cohosts.split(',').map(e => e.trim()).filter(Boolean) : [];
  var cdEmail = data.cdEmail ? data.cdEmail.trim() : null;

  var createdCount = 0;
  var summaryList = [];

  data.selectedMilestones.forEach(function(item) {
    var reminderDate = new Date(eventDate);
    reminderDate.setDate(eventDate.getDate() - item.offsetDays);

    var isShiftedToToday = false;
    if (reminderDate < today) {
      reminderDate = new Date(today);
      isShiftedToToday = true;
    }

    var title = "[" + data.eventTitle + "] " + item.title;
    
    var guests = [...cohostList];
    if (item.cdInvolved && cdEmail) {
      guests.push(cdEmail);
    }

    var options = {
      description: "Planning milestone for upcoming RA event: " + data.eventTitle
    };

    if (guests.length > 0) {
      options.guests = guests.join(',');
      options.sendInvites = true;
    }

    var calendarEvent = calendar.createAllDayEvent(title, reminderDate, options);
    calendarEvent.setGuestsCanModify(true);

    createdCount++;

    // Format display date for summary (e.g. MM/DD/YYYY)
    var formattedDate = (reminderDate.getMonth() + 1) + '/' + reminderDate.getDate() + '/' + reminderDate.getFullYear();
    
    // Format weeks label for summary
    var weeksVal = item.offsetWeeks !== undefined ? item.offsetWeeks : (item.offsetDays / 7);
    var weekLabel = "";
    if (weeksVal === 0) {
      weekLabel = "Event Day";
    } else {
      var isAfter = weeksVal < 0;
      var absWeeks = Math.abs(weeksVal);
      weekLabel = absWeeks + " " + (absWeeks === 1 ? "week" : "weeks") + " " + (isAfter ? "after" : "prior");
    }

    var line = "• " + item.title + " (" + weekLabel + ") - Date: " + formattedDate;
    if (isShiftedToToday) {
      line += " [Scheduled Today - Catch-up]";
    }
    summaryList.push(line);
  });

  // Build clean text block for EPF copy-pasting
  var formattedEventDate = (eventDate.getMonth() + 1) + '/' + eventDate.getDate() + '/' + eventDate.getFullYear();
  var summaryText = "EVENT PLANNING TIMELINE & REMINDERS\n" +
                    "Event: " + data.eventTitle + "\n" +
                    "Main Event Date: " + formattedEventDate + "\n" +
                    "----------------------------------------\n" +
                    summaryList.join("\n");

  return {
    count: createdCount,
    message: "Success! Added " + createdCount + " milestones to your calendar.",
    summaryText: summaryText
  };
}