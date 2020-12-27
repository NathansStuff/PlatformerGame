import Phaser from 'phaser';
import Player from '../entities/Player';

class Play extends Phaser.Scene {

    constructor() {
        super('PlayScene');
    }

    preload() {
        this.load.image('sky', 'assets/sky.png');
    }

    create() {
        const map = this.createMap();
        const layers = this.createLayers(map);
        
        this.player = this.createPlayer();
        this.physics.add.collider(this.player, layers.platformColliders);

        this.playerSpeed = 200;
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    createMap() {
        const map = this.make.tilemap({key: 'map'});
        map.addTilesetImage('main_lev_build_1', 'tiles-1');
        map.addTilesetImage('main_lev_build_2', 'tiles-2');
        return map;
    }

    createLayers(map) {
        const tileset1 = map.getTileset('main_lev_build_1');
        const tileset2 = map.getTileset('main_lev_build_2');
        const platformColliders = map.createStaticLayer('platform_colliders', [tileset1,tileset2]);

        const environment = map.createStaticLayer('environment', [tileset1, tileset2]);
        const platforms = map.createStaticLayer('platforms', [tileset1,tileset2]);

        platformColliders.setCollisionByExclusion(-1, true);

        return { environment, platforms, platformColliders };
    }

    createPlayer(map) {
        const player = new Player(this, 100, 250);
        player.body.setGravityY(500);
        player.setCollideWorldBounds(true);
        return player;
    }

    update() {
        const { left, right } = this.cursors;

        if (left.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (right.isDown) {
            this.player.setVelocityX(this.playerSpeed);
        } else {
            this.player.setVelocityX(0);
        }
    }
}

export default Play;