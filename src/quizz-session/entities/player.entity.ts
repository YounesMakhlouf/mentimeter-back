import {Option } from "../../options/entities/option.entity";

export class Player {
    pseudo: string;
    avatar: string;
    score: number;
    answers: Option[];
    socketId: string;

    constructor(pseudo: string, avatar: string, socketId: string) {
        this.pseudo = pseudo;
        this.avatar = avatar;
        this.score = 0;
        this.answers = [];
        this.socketId = socketId;
    }
}
