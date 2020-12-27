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
        const player = this.createPlayer();
        
        this.createPlayerColliders(player, {colliders: {
            platformColliders: layers.platformColliders
        }
    });
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
        return new Player(this, 100, 250);
    }

    createPlayerColliders(player, {colliders}) {
        player 
            .addCollider(colliders.platformColliders)
    }
}

export default Play;