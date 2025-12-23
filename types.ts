
export enum GestureState {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  FOCUS = 'FOCUS',
  HEART = 'HEART'
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: Landmark[];
  gesture: GestureState;
}

export interface LetterContent {
  title: string;
  body: string;
  sender: string;
  photos: string[]; // Base64 格式的照片数据
  photoCount: number; // 用户定义的照片粒子数量
}
