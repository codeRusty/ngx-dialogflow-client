import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Message } from '../../models/message';
import { DialogflowService } from '../../services/dialogflow.service';
import { SpeechRecognitionService } from '../../services/Speech.service';
import { Router } from '@angular/router';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'message-form',
  templateUrl: './message-form.component.html',
  styleUrls: ['./message-form.component.scss']
})
export class MessageFormComponent implements OnInit, OnDestroy {
  showSearchButton: boolean;
  speechSubscription: any;
  user: any;
  sugesstions = ['Hi', 'Hello', 'Help', 'What can you do for me?', 'Search Doctor', 'Search Dentist', 'Thanks'];

  // tslint:disable-next-line:no-input-rename
  @Input('message')
  public message: Message;

  // tslint:disable-next-line:no-input-rename
  @Input('messages')
  public messages: Message[];

  localMessages: any;
  constructor(private router: Router,
    private dialogFlowService: DialogflowService,
    public speechRecognitionService: SpeechRecognitionService) {
    this.showSearchButton = true;
    const stringJsonUser = localStorage.getItem('user_cred');
    if (stringJsonUser == null) {
      this.router.navigate(['home']);
    } else {
      this.user = JSON.parse(stringJsonUser);
    }
  }

  ngOnInit() {
  }

  public sendMessage(): void {
    this.sugesstions = [];
    if (this.message.speech !== '') {
      this.message.timestamp = new Date();
      this.message.messages = [{ speech: this.message.speech }];
      this.messages.push(this.message);

      this.dialogFlowService.getResponse(this.message.speech).subscribe(res => {
        res.result.fulfillment.messages.forEach(element => {
          if (element.type === 0) {
            this.messages.push(new Message(element.speech, 'assets/images/bot.png', res.timestamp, [], true));
          }
          if (element.type === 2) {
            element.replies.forEach(sugession => {
              this.sugesstions.push(sugession);
            });
          }
        });

      });

      this.message = new Message('', this.user.photoURL);
    }
  }
  ngOnDestroy() {
    this.speechRecognitionService.DestroySpeechObject();
  }
  activateSpeechSearchMovie(): void {
    this.showSearchButton = false;

    this.speechSubscription = this.speechRecognitionService.record()
      .subscribe(
        // listener
        (value) => {
          // this.speechData = value;
          this.message.speech = value;
          console.log(value);
        },
        // errror
        (err) => {
          console.log(err);
          if (err.error === 'no-speech') {
            console.log('--restatring service--');
            this.activateSpeechSearchMovie();
          }
        },
        // completion
        () => {
          this.showSearchButton = true;
          console.log('--complete--');
          this.activateSpeechSearchMovie();
        });
  }
  suggest(suggestion) {
    this.message.speech = suggestion;
    this.sendMessage();
    this.sugesstions = [];
  }
  stopSpeechSearchMovie() {
    this.speechRecognitionService.DestroySpeechObject();
    this.speechSubscription.unsubscribe();
    this.showSearchButton = !this.showSearchButton;
  }

}