import {Component, Input, Output, ElementRef, NgZone, EventEmitter, ViewChildren, QueryList} from 'angular2/core';
import {NgFor, NgIf} from 'angular2/common';
import {NativeFeedback} from './common';
import {StyleSheet, processColor} from 'react-native';
import {TodoMVC} from "./todomvc";

@Component({
  selector: 'ball',
  host: {position: 'absolute', top: '0', left: '0', bottom: '0', right: '0'},
  inputs: ['color', 'x', 'y', 'radius'],
  directives: [NgIf, TodoMVC],
  template: `
<View [style]="styles.ball" [top]="_y" [left]="_x" [backgroundColor]="_color" [borderRadius]="_radius" [width]="_radius*2" [height]="_radius*2"
  (pan)="moveBall($event)" (panend)="endMoveBall($event)">
  <todo-mvc *ngIf="withTodoMVC"></todo-mvc>
</View>
`
})
export class Ball {
  @Input() withTodoMVC: boolean = false;
  @Output() startMove: EventEmitter<any> = new EventEmitter();

  _x: number;
  _y: number;
  _color: number;
  _radius: number;
  _vX: number = 0;
  _vY: number = 0;
  styles: any;
  _el: any;
  constructor(el: ElementRef) {
    this._el = el.nativeElement;
    this.styles = StyleSheet.create({
      ball: {
        position: 'absolute'
      },
      ballText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 20
      }
    });
  }

  moveBall(event: any) {
    this._el.children[1].setProperties({top: this._y + event.deltaY, left: this._x + event.deltaX});
  }

  endMoveBall(event: any) {
    this._x += event.deltaX;
    this._y += event.deltaY;
    this._vX = event.velocityX;
    this._vY = event.velocityY;
    this.startMove.emit(null);
  }

  _velocityMove(): boolean {
    if (this._vX != 0 || this._vY != 0) {
      var newX = this._x + 10 * this._vX;
      var newY = this._y + 10 * this._vY;
      if (newX < 0) {
        newX = 0;
        this._vX = -this._vX;
      } else if (newX + 2 * this._radius > 320) {
        newX = 320 - 2 * this._radius;
        this._vX = -this._vX;
      }
      if (newY < 0) {
        newY = 0;
        this._vY = -this._vY;
      } else if (newY + 2 * this._radius > 480) {
        newY = 480 - 2 * this._radius;
        this._vY = -this._vY;
      }
      this._x = newX;
      this._y = newY;
      this._vX = this._decreaseVelocity(this._vX);
      this._vY = this._decreaseVelocity(this._vY);
      return true;
    }
    return false;
  }

  _decreaseVelocity(v: number) {
    if (v < 0) {
      return Math.min(v + 0.01, 0);
    } else {
      return Math.max(v - 0.01, 0);
    }
  }

  set x (value: any) { this._x = (!isNaN(parseInt(value))) ? parseInt(value) : value;  }
  set y (value: any) { this._y = (!isNaN(parseInt(value))) ? parseInt(value) : value; }
  set radius (value: any) { this._radius = (!isNaN(parseInt(value))) ? parseInt(value) : value; }
  set color (value: any) { this._color = processColor(value); }
}

@Component({
  selector: 'animation-app',
  host: {position: 'absolute', top: '0', left: '0', bottom: '0', right: '0'},
  directives: [NgFor, NativeFeedback, Ball],
  template: `
<Switch height="27" width="50" (topChange)="withTodoMVC=$event.value; $event.target.setProperty('on', $event.value)"></Switch>
<ball *ngFor="#ball of balls" x="{{ball.x}}" y="{{ball.y}}" color="{{ball.color}}" radius="{{ball.radius}}" [withTodoMVC]="withTodoMVC" (tap)="moveAll()" (startMove)="startMove()"></ball>
`
})
export class AnimationApp {
  @ViewChildren(Ball) ballsChildren: QueryList<Ball>;
  balls: Array<any> = [];
  private isMoveOngoing: boolean = false;
  private withTodoMVC: boolean = false;

  constructor(private zone: NgZone){
    for (var i = 0; i < 20; i++) {
      var colors = ['#ce0058', '#00a9e0', '#333333', '#ffb549', '#309712']
      this.balls.push({
        x: 0 + Math.random() * 220,
        y: 0 + Math.random() * 380,
        radius: 10 + Math.random() * 30,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  moveAll() {
    for (var ball of this.ballsChildren.toArray()) {
      if (ball._vX == 0 && ball._vY == 0) {
        ball._vX = Math.random() * 3 - 1;
        ball._vY = Math.random() * 3 - 1;
      }
    }
    this.startMove();
  }

  startMove() {
    if (!this.isMoveOngoing) {
      this.isMoveOngoing = true;
      requestAnimationFrame((currentTime) => this.zone.run(() => {
        this.doMove();
      }));
    }
  }

  doMove() {
    var goOn = false;
    for (var ball of this.ballsChildren.toArray()) {
      var more = ball._velocityMove();
      goOn = goOn || more;
    }
    if (goOn) {
      requestAnimationFrame((currentTime) => this.zone.run(() => {
        this.doMove();
      }));
    } else {
      this.isMoveOngoing = false;
    }
  }
}