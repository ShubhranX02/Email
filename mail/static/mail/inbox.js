document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = () => {
    send_mail();

    return false;
  };
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipients, subject, body) {

  recipients = recipients || '';
  subject = subject || '';
  body = body || '';

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector("#email-view").style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}


function send_mail()
{
  let recipients = document.querySelector("#compose-recipients").value;
  let subject = document.querySelector("#compose-subject").value;
  let body = document.querySelector("#compose-body").value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox("sent");
  })
  .catch(e => {
    console.log(e);
  });
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector("#email-view").style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3 style="margin-bottom: 20px; margin-left: 10px;">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    const emailArea = document.querySelector("#emails-view");

    if (emails.length == 0)
    {
      let noMail = document.createElement("h5");
      noMail.innerHTML = "No mails.";
      noMail.style.marginLeft = "15px";
      emailArea.append(noMail);
    }
    else 
    {
      let div;
      let timeStamp;
      let sender;
      let subject;

      for (let i = 0; i < emails.length; i++)
      {

        div = document.createElement("div");
        div.classList.add("email");
        
        timeStamp = document.createElement("p");
        sender = document.createElement("p");
        subject = document.createElement("p");

        timeStamp.innerHTML = emails[i].timestamp;
        sender.innerHTML = emails[i].sender;
        subject.innerHTML = emails[i].subject;

        if (emails[i].read)
        {
          div.style.backgroundColor = "#eeeeee";
        }

        div.append(timeStamp);
        div.append(sender);
        div.append(subject);

        emailArea.append(div);

        div.addEventListener("click", () => load_email(emails[i].id, mailbox));
      }

    }
    
  });
}

function load_email(emailId, mailbox)
{
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector("#email-view").style.display = 'block';

  fetch(`emails/${emailId}`)
  .then(response => response.json())
  .then(email => {

    document.querySelector("#email-view").innerHTML = `<h5 style="margin-bottom: 20px;">Email from ${email.sender}</h5>`;

    const emailArea = document.querySelector("#email-view");

    let sender = document.createElement("p");
    let recipients = document.createElement("p");
    let subject = document.createElement("p");
    let body = document.createElement("p");
    let timestamp = document.createElement("p");

    sender.innerHTML = "<span style='font-weight: 600;'>Sender: </span>" + email.sender;
    recipients.innerHTML = "<span style='font-weight: 600;'>Recipients: </span>" + email.recipients;
    subject.innerHTML = "<span style='font-weight: 600;'>Subject: </span>" + email.subject;
    body.innerHTML = "<span style='font-weight: 600;'>Body: </span><br>" + email.body;
    timestamp.innerHTML = "<span style='font-weight: 600;'>Timestamp: </span>" + email.timestamp;

    emailArea.append(sender);
    emailArea.append(recipients);
    emailArea.append(subject);
    emailArea.append(body);
    emailArea.append(timestamp);

    let reply = document.createElement("button");
    reply.classList.add("archive-button");
    reply.innerHTML = "Reply";

    let reply_recipient = email.sender;
    let reply_subject = email.subject;
    let reply_body = email.body;

    if (reply_subject.slice(0, 4) !== "Re: ")
    {
      reply_subject = "Re: " + reply_subject;
    }

    reply_body = "On " + email.timestamp + " " +  email.sender + " wrote: \n" + reply_body + "\n\n"

    reply.onclick = () => compose_email(reply_recipient, reply_subject, reply_body);

    if (mailbox == "inbox" || mailbox == "archive")
    {
      let button = document.createElement("button");
      let pressArchive;
      button.classList.add("archive-button");

      if (mailbox == "inbox")
      {
        button.innerHTML = "Archive";
        pressArchive = true;
      }
      else
      {
        button.innerHTML = "Unarchive";
        pressArchive = false;
      }

      button.onclick = () => {
        fetch(`/emails/${emailId}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: pressArchive
          })
        })
        .then(() => {
          load_mailbox("inbox");
        });
      };

      emailArea.append(button);
      emailArea.append(document.createElement("br"));
      emailArea.append(document.createElement("br"));
      emailArea.append(reply);
    }
    
  });

  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });
}