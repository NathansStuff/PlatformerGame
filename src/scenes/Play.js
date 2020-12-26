import Phaser from 'phaser';
class Play extends Phaser.Scene {

    constructor() {
        super('PlayScene');
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
    }

    create() {
        const map = this.make.tilemap({key: 'map'});
        const tileset1 = map.addTilesetImage('main_lev_build_1', 'tiles-1');
        const tileset2 = map.addTilesetImage('main_lev_build_2', 'tiles-2');

        map.createStaticLayer('environment', [tileset1, tileset2]);
        map.createStaticLayer('platforms', [tileset1,tileset2]);
    }
}

export default Play;